export function Popup() {
  const openSidePanel = () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
    window.close();
  };

  return (
    <div className="w-64 p-4">
      <h1 className="text-base font-bold text-blue-600 mb-3">SF Mothership</h1>
      <button
        onClick={openSidePanel}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
      >
        Side Panel を開く
      </button>
    </div>
  );
}
