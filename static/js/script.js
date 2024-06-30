document.addEventListener('DOMContentLoaded', (event) => {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speed-value');
    const form = document.getElementById('upload-form');
    const loading = document.getElementById('loading');
    const downloadLink = document.getElementById('download-link');
    const downloadButton = document.getElementById('download-button');
    const fileLabel = document.querySelector('label[for="file"]');
    const convertButton = document.querySelector('button[type="submit"]');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropzone.classList.add('dragover');
    }

    function unhighlight(e) {
        dropzone.classList.remove('dragover');
    }

    dropzone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        updateFileLabel(files[0].name);
    }

    // Allow clicking in the dropzone (except the convert button) to trigger file input
    dropzone.addEventListener('click', (e) => {
        if (e.target !== fileInput && e.target !== convertButton) {
            e.preventDefault();
            fileInput.click();
        }
    });

    // Update label when file is selected via input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            updateFileLabel(e.target.files[0].name);
        }
    });

    function updateFileLabel(fileName) {
        fileLabel.textContent = `Selected file: ${fileName}`;
        fileLabel.classList.add('file-selected');
        dropzone.classList.add('file-selected');
    }

    // Speed control
    speedInput.addEventListener('input', (e) => {
        speedValue.textContent = `${e.target.value}x`;
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (fileInput.files.length === 0) {
            alert('Please select a PDF file first.');
            return;
        }

        const formData = new FormData(form);
        dropzone.style.display = 'none';
        loading.style.display = 'block';

        try {
            const response = await fetch('/', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.error) {
                alert(data.error);
                dropzone.style.display = 'block';
                loading.style.display = 'none';
            } else {
                // Poll for file availability
                checkFileAvailability(data.filename);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during the conversion process.');
            dropzone.style.display = 'block';
            loading.style.display = 'none';
        }
    });

    function checkFileAvailability(filename) {
        const checkInterval = setInterval(async () => {
            try {
                const response = await fetch(`/download/${filename}`);
                if (response.ok) {
                    clearInterval(checkInterval);
                    loading.style.display = 'none';
                    downloadLink.style.display = 'block';
                    downloadButton.href = `/download/${filename}`;
                }
            } catch (error) {
                console.error('Error checking file availability:', error);
            }
        }, 5000); // Check every 5 seconds
    }
});