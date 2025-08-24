import type { App } from './App.js';

export interface UIMenuItem {
    id: string;
    label: string;
    attributes?: Record<string, string>;
}

export class UIMenu {
    constructor(
        private _id: string,
        private _icon: string,
        private _title: string
    ) {}

    // Getters for private properties
    get id(): string { return this._id; }
    get icon(): string { return this._icon; }
    get title(): string { return this._title; }

    // Get the picker element ID for JavaScript
    getPickerId(): string {
        return `${this.id}-picker`;
    }

    // Get the button ID for JavaScript
    getButtonId(): string {
        return `${this.id}-btn`;
    }

    // Get the group ID for HTML
    getGroupId(): string {
        return this.id;
    }

    // Get the method names for this menu following our naming convention
    getPickerListMethodName(): string {
        return `generatePickerList_${this.id.charAt(0).toUpperCase() + this.id.slice(1)}`;
    }

    getPickHandlerMethodName(): string {
        return `handlePick_${this.id.charAt(0).toUpperCase() + this.id.slice(1)}`;
    }

    // Generate the complete HTML for this menu using YAML template
    generateHTML(pickerList: string): string {
        const template = `
            <div class="p2p4vs-group" id="${this.getGroupId()}">
                <button class="p2p4vs-btn p2p4vs-dd-btn" 
                        id="${this.getButtonId()}" 
                        data-target="${this.getPickerId()}" 
                        data-group="${this.getGroupId()}" 
                        title="${this.title}">${this.icon}</button>
                <div class="p2p4vs-dd" id="${this.getPickerId()}">
                    ${pickerList}
                </div>
            </div>
        `;
        return template.trim();
    }

    // Generate JavaScript for this menu using YAML template
    generateJavaScript(): string {
        const template = `
            const ${this.id}Picker = document.getElementById('${this.getPickerId()}');
            
            // Generic click handler
            document.getElementById('${this.getButtonId()}').addEventListener('click', (e) => {
                e.stopPropagation();
                const picker = document.getElementById('${this.getPickerId()}');
                const group = document.getElementById('${this.getGroupId()}');
                const shown = picker.style.display === 'block';
                hideAll();
                picker.style.display = shown ? 'none' : 'block';
                
                const r = group.getBoundingClientRect();
                picker.style.top = (r.height + 4) + 'px';
                picker.style.left = '0px';
            });

            // Generic pick handler
            ${this.id}Picker.addEventListener('click', (e) => {
                const item = e.target.closest('.item');
                if (!item) return;
                
                const selectedId = item.getAttribute('data-id');
                if (selectedId) {
                    ${this.getPickHandlerMethodName()}(selectedId);
                    hideAll();
                }
            });
        `;
        return template.trim();
    }

    // Get the template variable name for this menu's picker list
    getTemplateVariableName(): string {
        return `${this.id.toUpperCase()}_PICKER_LIST`;
    }

    // Get the data attributes for this menu
    getDataAttributes(): Record<string, string> {
        return {
            'data-target': this.getPickerId(),
            'data-group': this.getGroupId()
        };
    }
}