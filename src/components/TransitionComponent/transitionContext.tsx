import { createContext, useState } from 'react';

const TransitionContext = createContext({ completed: false } as TransitionContextType);

export const TransitionProvider = ({ children }) => {
  const [completed, setCompleted] = useState(false);

  const toggleCompleted = (value: boolean) => {
    setCompleted(value);
  };

  return (
    <TransitionContext.Provider
      value={{
        toggleCompleted,
        completed,
      }}>
      {children}
    </TransitionContext.Provider>
  );
};

export default TransitionContext;

export const useTransitionContext = () => {
  return useContext(TransitionContext);
};

type TransitionContextType = {
  toggleCompleted: (value: boolean) => void;
  completed: boolean;
};
