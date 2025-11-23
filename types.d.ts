type EventPayloadMapping = {
  frameMinimize: void;
  frameMaximize: void;
  frameClose: void;
};

type UnSubscribeFunction = () => void;

interface Window {
  electron: {
    frameMinimize: () => void;
    frameMaximize: () => void;
    frameClose: () => void;
  };
}
