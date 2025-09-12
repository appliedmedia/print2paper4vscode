// PDF Viewer JavaScript
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
const scale = 1.5;
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');

function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then(function (page) {
    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };
    const renderTask = page.render(renderContext);

    renderTask.promise.then(function () {
      pageRendering = false;
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });
}

function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

function onPrevPage() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
}

function onNextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}

function onDocumentLoadSuccess(pdf) {
  pdfDoc = pdf;
  document.getElementById('loading').style.display = 'none';
  document.getElementById('pdf-canvas').style.display = 'block';
  renderPage(pageNum);
}

function onDocumentLoadError(error) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'block';
  document.getElementById('error').textContent = 'Error loading PDF: ' + error.message;
}

// Initialize PDF viewer when page loads
function initPdfViewer(pdfDataUrl) {
  pdfjsLib.getDocument(pdfDataUrl).promise.then(onDocumentLoadSuccess, onDocumentLoadError);
}

// Make initPdfViewer available globally
window.initPdfViewer = initPdfViewer;
