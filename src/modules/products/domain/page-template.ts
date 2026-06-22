import {
  CategoryId,
  PageTemplateId,
  UserId,
} from 'src/modules/shared/domain/ids';
import { Name } from 'src/modules/shared/value-objects/name';

// draft templates only allowed to be hard deleted!
// published can be hard deleted when exactly zero of products are relying on.
// modify a template = copy the template with new id+status= 'draft' so that its immutable and only cloned templates allowed to be edited.
// [immutablity] cloning : is because to prevent affecting/breaking multiple products relying on one published template.
// when user edits the template and wants to save his changes without publishing it for later more editing, we have to consider allow updating the model when its draft.
// types

// how the editor state is structured (craft.js / grapesjs style)
type EditorState = Record<string, unknown>; // craft.js uses node map, grapesjs uses component tree
type PageTemplateProps = {
  readonly id: PageTemplateId;
  name: Name;
  editorState: EditorState; // craft.js uses node map, grapesjs uses component tree
  renderedHtml: string; // saved for customer → fast rendering
  categoryId?: CategoryId | null;
  createdBy: UserId; // since template are immutable, we decide to set the user here.
  createdAt: Date;
};

type CreatePageTemplateDraftProps = Omit<PageTemplateProps, 'createdAt'>;
abstract class PageTemplate {
  protected constructor(protected data: PageTemplateProps) {}

  protected static validateHtml(html: string) {
    if (!html.trim()) throw new Error('Rendered HTML is required');
  }

  updateMetadata(info: { name?: Name; categoryId?: string | null }): void {
    if (info.name !== undefined) {
      this.data.name = info.name;
    }
    if (info.categoryId !== undefined) {
      this.data.categoryId =
        info.categoryId === null ? null : CategoryId.create(info.categoryId); // create new id for categoryId if not exist, will cause a bug later!
    }
  }
  get id(): PageTemplateId {
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
  toJSON(): PageTemplateProps {
    return { ...this.data };
  }
}
export class PageTemplateDraft extends PageTemplate {
  private constructor(data: PageTemplateProps) {
    super(data);
  }
  static create(props: CreatePageTemplateDraftProps): PageTemplateDraft {
    PageTemplate.validateHtml(props.renderedHtml);
    const now = new Date();
    return new PageTemplateDraft({
      ...props,
      createdAt: now,
    });
  }
  static restore(props: PageTemplateProps): PageTemplateDraft {
    return new PageTemplateDraft(props);
  }
  updateContent(props: {
    editorState: EditorState;
    renderedHtml: string;
  }): void {
    PageTemplate.validateHtml(props.renderedHtml);

    this.data.editorState = props.editorState;
    this.data.renderedHtml = props.renderedHtml;
  }
  publish(): PageTemplatePublished {
    return PageTemplatePublished.createFromDraft(this);
  }
}

export class PageTemplatePublished extends PageTemplate {
  private constructor(data: PageTemplateProps) {
    super(data);
  }
  static createFromDraft(draft: PageTemplateDraft): PageTemplatePublished {
    return new PageTemplatePublished(draft.toJSON());
  }
  static restore(props: PageTemplateProps): PageTemplatePublished {
    return new PageTemplatePublished(props);
  }
}
