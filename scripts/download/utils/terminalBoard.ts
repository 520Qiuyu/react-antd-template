/**
 * 终端状态板：整屏清屏重绘（Windows/Cursor 终端更稳，避免行数错位刷屏）。
 *
 * @example
 * const board = new TerminalBoard({ title: '歌单A', total: 10, config: { ... } });
 * board.setActive(0, '晴天-周杰伦', '下载', 'hi_res');
 * board.markDone(0, true);
 * board.finish();
 */
import { clearScreenDown, cursorTo } from 'node:readline';

export type TrackPhase =
  | '跳过'
  | '下载'
  | '解密'
  | '封面'
  | '内嵌'
  | '歌词'
  | '保存'
  | '完成'
  | '失败';

export interface BoardConfig {
  quality: string;
  concurrency: number;
  format: string;
  embed: boolean;
  lyrics: boolean;
}

interface ActiveSlot {
  label: string;
  phase: TrackPhase;
  detail?: string;
}

interface TerminalBoardOptions {
  title: string;
  total: number;
  config?: BoardConfig;
  outDir?: string;
}

const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';

/**
 * 按显示列宽截断（中文等宽字符按 2 列估算）。
 *
 * @example
 * truncateByWidth('你好世界hello', 8) // '你好世…'
 */
const truncateByWidth = (text: string, maxCols: number) => {
  if (maxCols <= 1) return '…';
  let width = 0;
  let result = '';
  for (const ch of text) {
    const w = ch.codePointAt(0)! > 0xff ? 2 : 1;
    if (width + w > maxCols - 1) {
      return `${result}…`;
    }
    width += w;
    result += ch;
  }
  return result;
};

/**
 * 生成简易进度条。
 *
 * @example
 * renderBar(3, 10, 20)
 */
const renderBar = (done: number, total: number, width = 28) => {
  if (total <= 0) return `[${'-'.repeat(width)}] 0%`;
  const ratio = Math.min(1, Math.max(0, done / total));
  const filled = Math.round(ratio * width);
  return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}] ${Math.round(ratio * 100)}%`;
};

export class TerminalBoard {
  private readonly title: string;
  private readonly total: number;
  private readonly config?: BoardConfig;
  private readonly outDir?: string;
  private readonly useLive: boolean;
  private readonly active = new Map<number, ActiveSlot>();
  private readonly recentFails: string[] = [];
  private success = 0;
  private failed = 0;
  private closed = false;
  private renderTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: TerminalBoardOptions) {
    this.title = options.title;
    this.total = options.total;
    this.config = options.config;
    this.outDir = options.outDir;
    this.useLive = Boolean(process.stdout.isTTY);

    if (this.useLive) {
      process.stdout.write(HIDE_CURSOR);
      process.once('exit', () => {
        process.stdout.write(SHOW_CURSOR);
      });
      process.once('SIGINT', () => {
        this.finish();
        process.exit(130);
      });
      this.renderNow();
    }
  }

  get stats() {
    return { success: this.success, failed: this.failed, total: this.total };
  }

  /**
   * 更新某首进行中状态并刷新画面。
   *
   * @example
   * board.setActive(3, '01 晴天 - 周杰伦', '解密', 'spatial');
   */
  setActive(index: number, label: string, phase: TrackPhase, detail?: string) {
    if (this.closed) return;
    this.active.set(index, { label, phase, detail });
    if (this.useLive) {
      this.scheduleRender();
      return;
    }
    const suffix = detail ? ` (${detail})` : '';
    console.log(`[${phase}] ${label}${suffix}`);
  }

  /**
   * 标记完成/失败，从活动槽移除。
   *
   * @example
   * board.markDone(3, false, '没有可下载的音质地址');
   */
  markDone(index: number, ok: boolean, errorMsg?: string) {
    if (this.closed) return;
    const slot = this.active.get(index);
    this.active.delete(index);

    if (ok) {
      this.success += 1;
    } else {
      this.failed += 1;
      const label = slot?.label || `#${index + 1}`;
      const tip = errorMsg ? `${label} · ${errorMsg}` : label;
      this.recentFails.push(tip);
      if (this.recentFails.length > 3) this.recentFails.shift();
    }

    if (this.useLive) {
      this.scheduleRender();
      return;
    }
    if (ok) console.log(`[完成] ${slot?.label || index + 1}`);
    else console.error(`[失败] ${slot?.label || index + 1}${errorMsg ? `：${errorMsg}` : ''}`);
  }

  /** 结束：最后一帧 + 恢复光标 + 汇总。 */
  finish() {
    if (this.closed) return;
    this.closed = true;
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
      this.renderTimer = null;
    }

    if (this.useLive) {
      this.renderNow();
      process.stdout.write(SHOW_CURSOR);
      process.stdout.write('\n');
    }

    const { success, failed, total } = this.stats;
    console.log(`[汇总] 成功 ${success}，失败 ${failed}，合计 ${total}`);
  }

  private scheduleRender() {
    if (this.renderTimer) return;
    this.renderTimer = setTimeout(() => {
      this.renderTimer = null;
      this.renderNow();
    }, 80);
  }

  private buildFrame(cols: number): string[] {
    const done = this.success + this.failed;
    const cfg = this.config;
    const lines: string[] = [
      `♪ ${truncateByWidth(this.title, cols - 2)}`,
      '',
    ];

    if (cfg) {
      lines.push(
        truncateByWidth(
          `  音质 ${cfg.quality}  ·  并发 ${cfg.concurrency}  ·  格式 ${cfg.format}  ·  内嵌 ${cfg.embed ? '开' : '关'}  ·  歌词 ${cfg.lyrics ? '开' : '关'}`,
          cols,
        ),
      );
    }
    if (this.outDir) {
      lines.push(truncateByWidth(`  输出 ${this.outDir}`, cols));
    }

    lines.push(
      '',
      `  ${renderBar(done, this.total, Math.min(28, Math.max(10, cols - 16)))}`,
      `  ${done}/${this.total}    ✓ ${this.success}    ✗ ${this.failed}    ▸ ${this.active.size}`,
      '',
    );

    if (this.active.size === 0) {
      lines.push(done >= this.total ? '  全部处理完毕' : '  等待任务…');
    } else {
      const slots = [...this.active.entries()].sort(([a], [b]) => a - b);
      for (const [, slot] of slots) {
        const detail = slot.detail ? ` · ${slot.detail}` : '';
        lines.push(
          truncateByWidth(`  ▸ [${slot.phase}] ${slot.label}${detail}`, cols),
        );
      }
    }

    if (this.recentFails.length) {
      lines.push('', '  最近失败：');
      for (const item of this.recentFails) {
        lines.push(truncateByWidth(`  ✗ ${item}`, cols));
      }
    }

    return lines;
  }

  private renderNow() {
    const cols = Math.max(40, process.stdout.columns || 80);
    const frame = this.buildFrame(cols).join('\n') + '\n';

    cursorTo(process.stdout, 0, 0);
    clearScreenDown(process.stdout);
    process.stdout.write(frame);
  }
}
