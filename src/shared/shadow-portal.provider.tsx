import React, {createContext, ReactNode, useContext} from 'react';
import {PortalProps} from '@mui/material/Portal';

interface PortalContextProps {
  portalContainer?: HTMLElement | Document | null,
  shadowRoot?: ShadowRoot | Document | null,
}

const PortalContainerContext = createContext<PortalContextProps>({});

export const usePortalContainer = () => useContext(PortalContainerContext);

type PortalProviderProps = {
  children: ReactNode
} & PortalContextProps
export const ShadowPortalProvider: React.FC<PortalProviderProps> = ({shadowRoot, portalContainer, children}) => {
  
  return (
    <PortalContainerContext.Provider value={{
      portalContainer,
      shadowRoot
    }}>
      {children}
    </PortalContainerContext.Provider>
  );
};

// Patch MUI Portal default behavior (optional global fallback)
export function withPortalContainer<P extends PortalProps>(Component: React.ComponentType<P>): React.FC<P> {
  return (props: P) => {
    const container = usePortalContainer();
    return <Component {...props} container={container ?? props.container}/>;
  };
}