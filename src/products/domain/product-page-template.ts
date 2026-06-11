import { UserId } from 'src/shared/domain/ids';
import { CategoryId } from './category';
// draft templates only allowed to be hard deleted!
// published can be hard deleted when exactly zero of products are relying on.
// modify a template = copy the template with new id+status= 'draft' so that its immutable and only cloned templates allowed to be edited.
// [immutablity] cloning : is because to prevent affecting/breaking multiple products relying on one published template.
// when user edits the template and wants to save his changes without publishing it for later more editing, we have to consider allow updating the model when its draft.
// types
export type PageTemplateId = string;

// how the editor state is structured (craft.js / grapesjs style)
export type EditorState = Record<string, unknown>; // craft.js uses node map, grapesjs uses component tree

const PageTemplateStatus = {
  Draft: 'draft',
  Published: 'published',
} as const;
export type PageTemplateStatus =
  (typeof PageTemplateStatus)[keyof typeof PageTemplateStatus];

type PageTemplateProps = {
  readonly id: PageTemplateId;
  name: string;
  editorState: EditorState; // craft.js uses node map, grapesjs uses component tree
  renderedHtml: string; // saved for customer → fast rendering
  createdAt: Date;
  createdBy: UserId;
  categoryId?: CategoryId | null;
};
type CreatePageTemplateDraftProps = {
  id: PageTemplateId;
  name: string;
  editorState: EditorState;
  renderedHtml: string;
  createdBy: UserId;
  categoryId?: CategoryId;
};
abstract class PageTemplate {
  protected constructor(protected data: PageTemplateProps) {}

  protected static validateHtml(html: string) {
    if (!html.trim()) throw new Error('Rendered HTML is required');
  }

  updateMetadata(info: { name?: string; categoryId?: string | null }): void {
    if (info.name !== undefined) {
      const name = info.name.trim();
      const nameLength = name.length;
      if (nameLength < 2 || nameLength > 20)
        throw new Error(
          'Template name length must range between 2 and 20 characters',
        );
      this.data.name = name;
    }
    if (info.categoryId !== undefined) {
      this.data.categoryId = info.categoryId;
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
  get name(): string {
    return this.data.name;
  }
}
class PageTemplateDraft extends PageTemplate {
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
  toJSON(): PageTemplateProps {
    return { ...this.data };
  }
}

class PageTemplatePublished extends PageTemplate {
  private constructor(data: PageTemplateProps) {
    super(data);
  }
  static createFromDraft(draft: PageTemplateDraft): PageTemplatePublished {
    return new PageTemplatePublished(draft.toJSON());
  }
}
