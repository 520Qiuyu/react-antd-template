import gsap from 'gsap';
import { useLocation } from 'react-router-dom';
import { SwitchTransition, CSSTransition } from 'react-transition-group';
import { useTransitionContext } from './transitionContext';

interface Props {
  children: (nodeRef: React.RefObject<HTMLElement | null>) => React.ReactNode;
}

// https://gsap.framer.wiki/timelines
const TransitionComponent = ({ children }: Props) => {
  const location = useLocation();
  const { toggleCompleted } = useTransitionContext();
  const nodeRef = useRef<HTMLElement>(null);
  return (
    <SwitchTransition>
      <CSSTransition
        key={location.pathname}
        timeout={500}
        nodeRef={nodeRef}
        addEndListener={(done) => {
          const node = nodeRef.current;
          // use the css transitionend event to mark the finish of a transition
          node?.addEventListener('transitionend', done, false);
        }}
        onEnter={() => {
          const node = nodeRef.current;
          toggleCompleted(false);
          gsap.set(node, { autoAlpha: 0, scale: 1, xPercent: -100 });
          gsap
            .timeline({
              paused: true,
              onComplete: () => toggleCompleted(true),
            })
            .to(node, { autoAlpha: 1, xPercent: 0, duration: 0.3, ease: 'power2.out' })
            .play();
        }}
        onExit={() => {
          const node = nodeRef.current;
          gsap.set(node, { autoAlpha: 0.6 });
          gsap
            .timeline({ paused: true })
            .to(node, { yPercent: 100, autoAlpha: 0, duration: 0.2, ease: 'power2.in' })
            .play();
        }}>
        {children(nodeRef)}
      </CSSTransition>
    </SwitchTransition>
  );
};

export default TransitionComponent;
