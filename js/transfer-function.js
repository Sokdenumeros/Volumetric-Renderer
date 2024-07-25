

// Get the DOM elements
var colorMapCanvas = document.getElementById('color-map-canvas');
const opacityValue = document.getElementById('opacity-value');
var startSlope1Value = document.getElementById('start-slope1-value');
var endSlope1Value = document.getElementById('end-slope1-value');
var startSlope2Value = document.getElementById('start-slope2-value');
var endSlope2Value = document.getElementById('end-slope2-value');
var colorValue = document.getElementById('color-picker');

// Get the 2D drawing context of the canvas
const ctx = colorMapCanvas.getContext('2d');

//tf1 conf variables
let opacity = 1;
let startSlope1 = 0;
let endSlope1 = 0;
let startSlope2 = 0;
let endSlope2 = 0;
let selectedColor = "#FFFFFF";
let transferFunctionChart;
let tF = {
    x0: 0,
    x1: 0,
    x2: 0,
    x3: 0,
    opacity: 1,
    color: [1,1,1],
  };

// Helper function to convert hex color to RGB components
function hexToRgb(hex) {
    // Remove the hash sign if it's present
    hex = hex.replace(/^#/, '');

    // Parse the hex color
    const bigint = parseInt(hex, 16);

    // Extract RGB components
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return [r, g, b];
}

// Initialize the transfer function color map
function initializeColorMap(minValue, maxValue) {
    // Set initial parameters (adjust these as needed)
    opacity = 1;
    opacityValue.value = opacity;
    startSlope1 = minValue;
    startSlope1Value.value = minValue;
    endSlope1 = maxValue;
    endSlope1Value.value = maxValue;
    startSlope2 = maxValue;
    startSlope2Value.value = maxValue;
    endSlope2 = maxValue;
    endSlope2Value.value = maxValue;
    selectedColor = "#FFFFFF";
    colorValue.value = selectedColor;
    

    //update the domain
    tF.x0 = startSlope1;
    tF.x1 = endSlope1;
    tF.x2 = startSlope2;
    tF.x3 = endSlope2;
    tF.opacity = opacity;
    const rgb = hexToRgb(selectedColor);
    tF.color = rgb.map(component => component / 255);

    //create the visualization
    let tfVis = [
        {x: startSlope1, y: 0},
        {x: endSlope1, y: opacity},
        {x: startSlope2, y: opacity},
        {x: endSlope2, y: 0},
    ];
    
    let tf1Data = {
        datasets: [
            {
                label: 'Transfer function',
                data: tfVis,
                borderColor: selectedColor,
                backgroundColor: 'rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.2)',
                borderWidth: 2,
                pointRadius: 5,
                pointBackgroundColor: 'white',
                showLine: true, // Display lines connecting the data points
            },
        ],
    };

    let chartOptions = {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'linear', // Use linear scaling for the x-axis
                position: 'bottom', // Display x-axis at the bottom
                min: minValue,
                max: maxValue,
                ticks: {
                    color: 'grey', // Set the color of the x-axis ticks
                },
                grid: {
                    color: 'grey', // Set the color of the x-axis grid lines
                },
            },
            y: {
                beginAtZero: true,
                max: 1, // You can adjust the maximum value based on your data.
                ticks: {
                    color: 'grey', // Set the color of the x-axis ticks
                },
                grid: {
                    color: 'grey', // Set the color of the x-axis grid lines
                },
            },
        },
    };

    // Update the chart data with new opacity and slope values
    //transferFunctionChart.update(); // Update the chart
    transferFunctionChart = new Chart(ctx, {
        type: 'line',
        data: tf1Data,
        options: chartOptions,
    });

    //Add the listeners
    opacityValue.addEventListener('input', updateTransferFunction);
    startSlope1Value.addEventListener('input', updateTransferFunction);
    endSlope1Value.addEventListener('input', updateTransferFunction);
    startSlope2Value.addEventListener('input', updateTransferFunction);
    endSlope2Value.addEventListener('input', updateTransferFunction);
    colorValue.addEventListener('input', updateTransferFunction);
}

// Function to update the transfer function visualization
function updateTransferFunction() {
    //update values
    opacity = parseFloat(opacityValue.value);
    startSlope1 = parseFloat(startSlope1Value.value);
    endSlope1 = parseFloat(endSlope1Value.value);
    startSlope2 = parseFloat(startSlope2Value.value);
    endSlope2 = parseFloat(endSlope2Value.value);
    selectedColor = colorValue.value;

    //update tF domain
    tF.x0 = startSlope1;
    tF.x1 = endSlope1;
    tF.x2 = startSlope2;
    tF.x3 = endSlope2;
    tF.opacity = opacity;
    const rgb = hexToRgb(selectedColor);
    tF.color = rgb.map(component => component / 255);

    //update TFVis
    let tfVis = [
        {x: startSlope1, y: 0},
        {x: endSlope1, y: opacity},
        {x: startSlope2, y: opacity},
        {x: endSlope2, y: 0},
    ];
    transferFunctionChart.data.datasets[0].data = tfVis;
    transferFunctionChart.data.datasets[0].borderColor = selectedColor;
    transferFunctionChart.data.datasets[0].backgroundColor = 'rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.2)',
    // You can add more advanced visualization techniques as needed.
    transferFunctionChart.update();
}

export { initializeColorMap, tF };

