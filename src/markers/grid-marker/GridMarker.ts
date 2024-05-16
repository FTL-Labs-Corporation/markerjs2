import {MarkerBase} from "../../core/MarkerBase";
import { Settings} from "../../core/Settings";
import {Vector2} from "@babylonjs/core";

export class GridMarker extends MarkerBase {
  public static typeName = 'GridMarker';
  public static title = 'Grid Marker';
  public static icon = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id="smallGrid" width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M 6 0 L 0 0 0 6" fill="none" stroke="gray" stroke-width="3"/>
            </pattern>
            <pattern id="grid" width="18" height="18" patternUnits="userSpaceOnUse">
                <rect width="18" height="18" fill="url(#smallGrid)"/>
                <path d="M 18 0 L 0 0 0 18" fill="none" stroke="gray" stroke-width="3"/>
            </pattern>
        </defs>  
        <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>`;

    public uuid: string;
    protected cellValues: string[][];
    public visual: SVGGElement;
    protected handles: (SVGCircleElement)[][];
    protected linesVertical: (SVGLineElement)[][];
    protected linesHorizontal: (SVGLineElement)[][];
    protected texts: SVGTextElement[][];
    protected gridSize: Vector2;
    protected cellSize: Vector2;
    protected strokeColor: string;
    protected strokeWidth: number;
    protected strokeDasharray: string;

    constructor(container: SVGGElement, overlayContainer: HTMLDivElement, settings: Settings, uuid: string, cellValues: Array<Array<string>>, vertices: Array<Array<Vector2 | null>>) {
        super(container, overlayContainer, settings);
        this.visual = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.gridSize = new Vector2(cellValues.length, cellValues[0].length);  // Adjustable grid size
        this.cellSize = new Vector2(50, 50);  // Adjustable cell size
        this.strokeColor = settings.defaultColor;
        this.strokeWidth = settings.defaultStrokeWidth;
        this.strokeDasharray = settings.defaultStrokeDasharray;
        this.handles = new Array<Array<SVGCircleElement>>;
        this.linesVertical = new Array<Array<SVGLineElement>>;
        this.linesHorizontal = new Array<Array<SVGLineElement>>;
        this.texts = new Array<Array<SVGTextElement>>;
        this.cellValues = cellValues;
        this.uuid = uuid;
        this.texts = [];
        this.container.appendChild(this.visual);
        if (vertices === null) {
            this.createDefaultHandles();
        }
        else    {
            this.createHandlesFromVertices(vertices);
        }
    }
    private createDefaultHandles()   {
        for (let x = 0; x < this.gridSize.x + 1; x++) {
            this.handles.push(new Array<SVGCircleElement>);
            for (let y = 0; y < this.gridSize.y + 1; y++) {
                this.handles[x].push(this.createVertex(x * this.cellSize.x, y * this.cellSize.y, false));
            }
        }
    }
    private createHandlesFromVertices(vertices: Array<Array<Vector2>>)   {
        if (vertices.length !== this.gridSize.x + 1 && vertices[0].length !== this.gridSize.y + 1 ) {
            for (let x = 0; x < this.gridSize.x + 1; x++) {
                this.handles.push(new Array<SVGCircleElement>);
                for (let y = 0; y < this.gridSize.y + 1; y++) {
                    this.handles[x].push(this.createVertex(vertices[x][y].x, vertices[x][y].y, false));
                }
            }
            this.createGrid();
        }
        else {
            this.createDefaultHandles();
        }
    }
    private createGrid(): void {
        for (let x = 0; x < this.gridSize.x + 1; x++) {
            this.linesVertical.push(new Array<SVGLineElement>);
            for (let y = 0; y < this.gridSize.y; y++) {
                    this.linesVertical[x].push(this.createLine(this.handles[x][y]!, this.handles[x][y + 1]!));
            }
        }
        for (let x = 0; x < this.gridSize.x; x++) {
            this.linesHorizontal.push(new Array<SVGLineElement>);
            for (let y = 0; y < this.gridSize.y + 1; y++) {
                    this.linesHorizontal[x].push(this.createLine(this.handles[x][y]!, this.handles[x + 1][y]!));
            }
        }
        // Append all vertices. Must be on top!!!!
        for (let x = 0; x < this.gridSize.x + 1; x++) {
            for (let y = 0; y < this.gridSize.y + 1; y++) {
                this.visual.appendChild(this.handles[x][y]!);
            }
        }
        // Create text labels at the center of each cell
        for (let x = 0; x < this.gridSize.x; x++) {
            this.texts.push(new Array<SVGTextElement>);
            for (let y = 0; y < this.gridSize.y; y++) {
                const text = this.createText(this.handles[x][y].cx.baseVal.value + this.cellSize.x / 2, this.handles[x][y].cx.baseVal.value + this.cellSize.y / 2, this.cellValues[x][y]);
                this.texts[x].push(text);
            }
        }
    }
    private createVertex(x: number, y: number, append = true): SVGCircleElement {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x.toString());
        circle.setAttribute('cy', y.toString());
        circle.setAttribute('r', '5');
        circle.setAttribute('fill', 'white');
        circle.setAttribute('stroke', 'black');
        circle.addEventListener('mousedown', (event) => this.onDragStart(circle, event));
        if (append) {
            this.visual.appendChild(circle);
        }
        return circle;
    }
    private createText(x: number, y: number, content: string): SVGTextElement {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x.toString());
        text.setAttribute('y', y.toString());
        text.setAttribute('fill', 'black');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = content;
        text.addEventListener('dblclick', (event) => this.editText(event, text));
        this.visual.appendChild(text);
        return text;
    }
    private createLine(startVertex: SVGCircleElement, endVertex: SVGCircleElement): SVGLineElement {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        try {
            line.setAttribute('x1', startVertex.getAttribute('cx')!);
            line.setAttribute('y1', startVertex.getAttribute('cy')!);
            line.setAttribute('x2', endVertex.getAttribute('cx')!);
            line.setAttribute('y2', endVertex.getAttribute('cy')!);
            line.setAttribute('stroke', this.strokeColor);
            line.setAttribute('stroke-width', this.strokeWidth.toString());
            line.setAttribute('stroke-dasharray', this.strokeDasharray);
            this.visual.appendChild(line);
        }
        catch{console.log("Line Error")}
        return line;
    }
    private onDragStart(circle: SVGCircleElement, event: MouseEvent): void {
        const offsetX = event.clientX - parseFloat(circle.getAttribute('cx')!);
        const offsetY = event.clientY - parseFloat(circle.getAttribute('cy')!);
        const moveHandler = (event: MouseEvent) => this.onDragMove(circle, event, offsetX, offsetY);
        const upHandler = () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
        event.preventDefault();
    }
    private onDragMove(circle: SVGElement, event: MouseEvent, offsetX: number, offsetY: number): void {
        const newX = event.clientX - offsetX;
        const newY = event.clientY - offsetY;
        circle.setAttribute('cx', newX.toString());
        circle.setAttribute('cy', newY.toString());
        this.updateConnectedLines(circle, newX, newY);
        this.updateConnectedText(circle, newX, newY);
    }
    private updateConnectedLines(circle: SVGElement, newX: number, newY: number): void {
        // Find all lines where this circle is either the start or the end
        for (let x = 0; x < this.gridSize.x + 1; x++) {
            for (let y = 0; y < this.gridSize.y + 1; y++) {
                if (circle == this.handles[x][y])  {
                    if (x > 0)
                    {
                        const line = this.linesHorizontal[x - 1][y];
                        line.setAttribute('x2', newX.toString());
                        line.setAttribute('y2', newY.toString());
                    }
                    if (y > 0)  {
                        const line = this.linesVertical[x][y - 1];
                        line.setAttribute('x2', newX.toString());
                        line.setAttribute('y2', newY.toString());
                    }
                    if (x < this.gridSize.x && y <= this.gridSize.y) {
                        this.linesHorizontal[x][y].setAttribute('x1', newX.toString());
                        this.linesHorizontal[x][y].setAttribute('y1', newY.toString());
                    }
                    if (x <= this.gridSize.x && y < this.gridSize.y) {
                        this.linesVertical[x][y].setAttribute('x1', newX.toString());
                        this.linesVertical[x][y].setAttribute('y1', newY.toString());
                    }
                }
            }
        }
    }
    private updateConnectedText(circle: SVGElement, circleX: number, circleY: number): void {
        // Find all lines where this circle is either the start or the end
        for (let x = 0; x < this.gridSize.x + 1; x++) {
            for (let y = 0; y < this.gridSize.y + 1; y++) {
                if (circle == this.handles[x][y])  {
                    this.updateSingleTextBox(x, y);
                    this.updateSingleTextBox(x - 1, y);
                    this.updateSingleTextBox(x, y - 1);
                    this.updateSingleTextBox(x - 1, y - 1);
                }
            }
        }
    }
    private updateSingleTextBox(x: number, y: number)   {
        try {
            const newPos: Vector2 = Vector2.Zero();
            const text = this.texts[x][y];
            // Upper Left Vertex
            newPos.x += Number(this.handles[x][y].getAttribute('cx'));
            newPos.y += Number(this.handles[x][y].getAttribute('cy'));
            // Lower Left Vertex
            newPos.x += Number(this.handles[x][y + 1].getAttribute('cx'));
            newPos.y += Number(this.handles[x][y + 1].getAttribute('cy'));
            // Upper Right Vertex
            newPos.x += Number(this.handles[x + 1][y].getAttribute('cx'));
            newPos.y += Number(this.handles[x + 1][y].getAttribute('cy'));
            // Lower Right Vertex
            newPos.x += Number(this.handles[x + 1][y + 1].getAttribute('cx'));
            newPos.y += Number(this.handles[x + 1][y + 1].getAttribute('cy'));
            text.setAttribute('x', (newPos.x / 4).toString());
            text.setAttribute('y', (newPos.y / 4).toString());
        }
        catch{console.log("TextBox Error")}
    }
    private editText(event: MouseEvent, text: SVGTextElement): void {
        const textContent = text.textContent || '';
        const x = parseFloat(text.getAttribute('x')!);
        const y = parseFloat(text.getAttribute('y')!);
        const input = document.createElement('input');
        input.value = textContent;
        input.style.position = 'absolute';
        input.style.zIndex = '100';
        input.style.left = `${event.clientX}px`;
        input.style.top = `${event.clientY}px`;
        input.style.width = `100px`;
        input.style.transform = 'translate(-50%, -50%)';
        input.addEventListener('blur', () => {
            text.textContent = input.value;
            document.body.removeChild(input);
        });
        input.addEventListener('keydown', (keyEvent) => {
            if (keyEvent.key === 'Enter') {
                text.textContent = input.value;
                document.body.removeChild(input);
            }
        });
        document.body.appendChild(input);
        input.focus();
    }
}