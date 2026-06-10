import { AuditableEntity, AuditFields } from 'src/shared/domain/auditing';
import { ProductId, UserId } from 'src/shared/domain/ids';

// types
export type ProductPageTemplateId = string;

// how the editor state is structured (craft.js / grapesjs style)
export type EditorState = {
  version: number;
  nodes: Record<string, unknown>; // craft.js uses node map, grapesjs uses component tree
};

export type PublishStatus = 'draft' | 'published';

export class ProductPageTemplate extends AuditableEntity {
  private constructor(
    private readonly _id: ProductPageTemplateId,
    private readonly _productId: ProductId,
    private _editorState: EditorState, // saved for admin/worker → editor reload
    private _renderedHtml: string, // saved for customer → fast rendering
    private _status: PublishStatus,
    audit: AuditFields,
  ) {
    super(audit);
  }

  static create(props: {
    id: ProductPageTemplateId;
    productId: ProductId;
    editorState: EditorState;
    renderedHtml: string;
    createdBy: UserId;
  }): ProductPageTemplate {
    ProductPageTemplate.validateHtml(props.renderedHtml);
    const now = new Date();
    return new ProductPageTemplate(
      props.id,
      props.productId,
      props.editorState,
      props.renderedHtml,
      'draft',
      {
        createdBy: props.createdBy,
        updatedBy: props.createdBy,
        createdAt: now,
        updatedAt: now,
      },
    );
  }
  private static validateHtml(html: string) {
    if (!html.trim()) throw new Error('Rendered HTML is required');
  }
  update(props: {
    editorState: EditorState;
    renderedHtml: string;
    updatedBy: UserId;
  }): void {
    ProductPageTemplate.validateHtml(props.renderedHtml);
    this._editorState = props.editorState;
    this._renderedHtml = props.renderedHtml;
    this._status = 'draft'; // reset to draft on every update
    this.touch(props.updatedBy);
  }

  publish(updatedBy: UserId): void {
    this._status = 'published';
    this.touch(updatedBy);
  }

  unpublish(updatedBy: UserId): void {
    this._status = 'draft';
    this.touch(updatedBy);
  }

  get id(): ProductPageTemplateId {
    return this._id;
  }
  get productId(): ProductId {
    return this._productId;
  }
  get editorState(): EditorState {
    return this._editorState;
  }
  get renderedHtml(): string {
    return this._renderedHtml;
  }
  get status(): PublishStatus {
    return this._status;
  }
  isPublished(): boolean {
    return this._status === 'published';
  }
}
