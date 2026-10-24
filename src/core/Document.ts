import { Group } from "./Group";
import { IdRegistry } from "./IdRegistry";

/**
 * 一份 SVG 文档的内存表示：画布尺寸 + 根容器 + id 空间 + 读入时的源路径。
 * 具体图形的增删改由 commands 层通过方法调用来完成，Document 本身只存数据。
 */
export class Document {
  private _width: number;
  private _height: number;
  readonly root: Group;
  readonly ids: IdRegistry;
  /** read 时记录文件路径；save 无参数时使用。init / 未 read 时为 null。 */
  sourcePath: string | null;

  constructor(width: number, height: number) {
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      throw new Error(`invalid canvas size: ${width}x${height}`);
    }
    this._width = width;
    this._height = height;
    this.root = new Group("__root__");
    this.ids = new IdRegistry();
    this.sourcePath = null;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  setSize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      throw new Error(`invalid canvas size: ${width}x${height}`);
    }
    this._width = width;
    this._height = height;
  }
}