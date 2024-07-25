const camera = {
    canvas: null,
    viewMatrix: mat4.create(),
    projectionMatrix: mat4.create(), // Separate projection matrix
    sensitivity: 0.005,
    zoomSpeed: 0.1, // Adjust zoom speed as needed
    isMouseDragging: false,
    previousMousePosition: { x: 0, y: 0 },
    radius: 5,
    target: [0, 0, 0],
    eulerX: Math.PI / 4, // Initial Euler angle for rotation around X-axis
    eulerY: Math.PI / 4, // Initial Euler angle for rotation around Y-axis
    minFOV: 10, // Minimum FOV angle
    maxFOV: 150, // Maximum FOV angle
    currentFOV: 45, // Initial FOV angle

    init(canvas) {
        this.canvas = canvas;
        this.initEventListeners();
        this.updateViewMatrix();
        this.updateProjectionMatrix(); // Initialize projection matrix
    },

    initEventListeners() {
        this.canvas.addEventListener("mousedown", (e) => {
            this.isMouseDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener("mouseup", () => {
            this.isMouseDragging = false;
        });

        this.canvas.addEventListener("mousemove", (e) => {
            if (this.isMouseDragging) {
                const deltaX = e.clientX - this.previousMousePosition.x;
                const deltaY = e.clientY - this.previousMousePosition.y;
                this.rotateOrbit(deltaX, deltaY);
                this.previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        this.canvas.addEventListener("wheel", (e) => {
            this.zoom(e.deltaY);
        });
    },

    rotateOrbit(deltaX, deltaY) {
        this.eulerY += deltaX * this.sensitivity;
        this.eulerX += deltaY * this.sensitivity;

        // Limit the vertical angle to prevent camera flipping
        this.eulerX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.eulerX));

        this.updateViewMatrix();
    },

    zoom(deltaY) {
        this.currentFOV += deltaY * this.zoomSpeed;

        // Ensure FOV stays within the specified range
        this.currentFOV = Math.max(this.minFOV, Math.min(this.maxFOV, this.currentFOV));

        this.updateProjectionMatrix(); // Update projection matrix for zoom
    },

    updateViewMatrix() {
        const cosTheta = Math.cos(this.eulerY);
        const sinTheta = Math.sin(this.eulerY);
        const cosPhi = Math.cos(this.eulerX);
        const sinPhi = Math.sin(this.eulerX);

        const x = this.radius * cosTheta * cosPhi;
        const y = this.radius * sinPhi;
        const z = this.radius * sinTheta * cosPhi;

        this.position = [x, y, z];

        mat4.lookAt(this.viewMatrix, this.position, this.target, [0, 1, 0]);
    },

    updateProjectionMatrix() {
        const aspect = this.canvas.width / this.canvas.height;
        const fov = (Math.PI * this.currentFOV) / 180;

        // Update the projection matrix
        mat4.perspective(this.projectionMatrix, fov, aspect, 0.1, 100.0);
    },

    setSensitivity(sensitivity) {
        this.sensitivity = sensitivity;
    },
};

export default camera;
