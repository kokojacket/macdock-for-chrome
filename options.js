document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get('dockStyle', function(data) {
    if (data.dockStyle) {
      document.getElementById('backgroundColor').value = data.dockStyle.backgroundColor;
      document.getElementById('borderRadius').value = data.dockStyle.borderRadius;
    }
  });

  document.getElementById('save').addEventListener('click', function() {
    const backgroundColor = document.getElementById('backgroundColor').value;
    const borderRadius = document.getElementById('borderRadius').value;

    // 转换 rgba 为十六进制
    const rgb = backgroundColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
    const hex = rgb ? "#" +
      ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : backgroundColor;

    chrome.storage.sync.set({
      dockStyle: { backgroundColor: hex, borderRadius }
    }, function() {
      alert('设置已保存');
    });
  });
});