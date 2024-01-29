import React, { createContext, useContext } from "react";

const ReRenderHelperContext = createContext({
  updateState: () => {},
});

const ReRenderHelper = ({ children }: any) => {
  const [dummyState, setDummyState] = React.useState(false);

  function updateState() {
    setDummyState(!dummyState);
  }

  const value = { updateState };
  return (
    <ReRenderHelperContext.Provider value={value}>
      <div className={`rerender-helper-${dummyState}`}>{children}</div>
    </ReRenderHelperContext.Provider>
  );
};

export default ReRenderHelper;

export function useRerenderHelper() {
  const { updateState } = useContext(ReRenderHelperContext);

  function rerender() {
    updateState();
  }

  return rerender;
}
