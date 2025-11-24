import './TitleBar.css';

export function TitleBar() {
  return (
    <header className="title-bar">
      <div className="title-bar-controls">
        <button
          className="title-bar-button close"
          onClick={window.electron.frameClose}
          aria-label="Close"
        />
        <button
          className="title-bar-button minimize"
          onClick={window.electron.frameMinimize}
          aria-label="Minimize"
        />
        <button
          className="title-bar-button maximize"
          onClick={window.electron.frameMaximize}
          aria-label="Maximize"
        />
      </div>
      <div className="title-bar-drag">
        <span className="title-bar-title">Meowny</span>
      </div>
    </header>
  );
}
