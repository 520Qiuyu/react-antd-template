import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/redux/store';

/* 定义 Typed Hooks​
虽然可以将 RootState 和 AppDispatch types 导入每个组件，但最好 创建 pre-typed 版本的 useDispatch 和 useSelector hooks 以供应用中使用。有一些原因可以说明这很关键：

对于 useSelector 而言，它省去了每次定义 (state: RootState) 类型的需要
对于 useDispatch 而言，默认的 Dispatch type 不知道 thunks 或其他 middleware。为了正确 dispatch thunks，需要从包含 thunk middleware types 的 store 中，使用特定的自定义 AppDispatch type，并将其与 useDispatch 一起使用。添加一个 pre-typed 的 useDispatch hook 可以防止你忘记在需要的地方导入 AppDispatch。
由于它们是实际的变量而不是类型，因此在像 app/hooks.ts 这样单独的文件中，而不是 store 的设置文件中定义它们是很重要的。这允许你将它们导入到需要使用这些 hooks 的任何组件文件中，并避免了潜在的循环导入依赖问题。 */

// 在整个应用中使用，而不是简单的使用 `useDispatch` 和 `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
