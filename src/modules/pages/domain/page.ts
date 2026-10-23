import { CategoryId, PageId, UserId } from 'src/modules/shared/value-objects/ids';
import { Name } from 'src/modules/shared/value-objects/name';

// draft templates only allowed to be hard deleted!
// published can be hard deleted when exactly zero of products are relying on.
// modify a template = copy the template with new id+status= 'draft' so that its immutable and only cloned templates allowed to be edited.
// [immutablity] cloning : is because to prevent affecting/breaking multiple products relying on one published template.
// when user edits the template and wants to save his changes without publishing it for later more editing, we have to consider allow updating the model when its draft.
// types

// how the editor state is structured (craft.js / grapesjs style)
type EditorState = Record<string, unknown>; // craft.js uses node map, grapesjs uses component tree
type PageProps = {
  readonly id: PageId;
  name: Name;
  editorState: EditorState; // craft.js uses node map, grapesjs uses component tree
  renderedHtml: string; // saved for customer → fast rendering
  categoryId?: CategoryId | null;
  createdBy: UserId; // since template are immutable, we decide to set the user here.
  createdAt: Date;
};

type CreatePageDraftProps = Omit<PageProps, 'createdAt'>;
abstract class Page {
  protected constructor(protected data: PageProps) {}

  protected static validateHtml(html: string) {
    if (!html.trim()) throw new Error('Rendered HTML is required');
  }

  updateMetadata(info: { name?: Name; categoryId?: string | null }): void {
    if (info.name !== undefined) {
      this.data.name = info.name;
    }
    if (info.categoryId !== undefined) {
      this.data.categoryId = info.categoryId === null ? null : CategoryId.create(info.categoryId).unwrap(); // create new id for categoryId if not exist, will cause a bug later!
    }
  }
  get id(): PageId {
    return this.data.id;
  }

  get editorState(): EditorState {
    return this.data.editorState;
  }
  get renderedHtml(): string {
    return this.data.renderedHtml;
  }
  get categoryId(): CategoryId | undefined | null {
    return this.data.categoryId;
  }
  get name(): Name {
    return this.data.name;
  }
  toJSON(): PageProps {
    return { ...this.data };
  }
}
export class PageDraft extends Page {
  private constructor(data: PageProps) {
    super(data);
  }
  static create(props: CreatePageDraftProps): PageDraft {
    Page.validateHtml(props.renderedHtml);
    const now = new Date();
    return new PageDraft({
      ...props,
      createdAt: now,
    });
  }
  static restore(props: PageProps): PageDraft {
    return new PageDraft(props);
  }
  updateContent(props: { editorState: EditorState; renderedHtml: string }): void {
    Page.validateHtml(props.renderedHtml);

    this.data.editorState = props.editorState;
    this.data.renderedHtml = props.renderedHtml;
  }
  publish(): PagePublished {
    return PagePublished.createFromDraft(this);
  }
}

export class PagePublished extends Page {
  private constructor(data: PageProps) {
    super(data);
  }
  static createFromDraft(draft: PageDraft): PagePublished {
    return new PagePublished(draft.toJSON());
  }
  static restore(props: PageProps): PagePublished {
    return new PagePublished(props);
  }
}
