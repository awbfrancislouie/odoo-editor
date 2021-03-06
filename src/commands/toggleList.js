import {
    childNodeIndex,
    createList,
    getListMode,
    isBlock,
    preserveCursor,
    setTagName,
    toggleClass,
} from '../utils/utils.js';

Text.prototype.oToggleList = function (offset, mode) {
    this.parentElement.oToggleList(childNodeIndex(this), mode);
};

HTMLElement.prototype.oToggleList = function (offset, mode = 'UL') {
    if (!isBlock(this)) {
        return this.parentElement.oToggleList(childNodeIndex(this));
    }
    let inLI = this.closest('li');
    if (inLI) {
        return inLI.oToggleList(0, mode);
    }

    let main = createList(mode);
    let li = document.createElement('LI');
    main.append(li);
    const restoreCursor = preserveCursor(this.ownerDocument);

    this.after(main);
    li.append(this);
    restoreCursor(new Map([[this, li]]));
};

HTMLParagraphElement.prototype.oToggleList = function (offset, mode = 'UL') {
    let main = createList(mode);
    let li = document.createElement('LI');
    main.append(li);

    const restoreCursor = preserveCursor(this.ownerDocument);
    while (this.firstChild) {
        li.append(this.firstChild);
    }
    this.after(main);
    this.remove();

    restoreCursor(new Map([[this, li]]));
    return true;
};

HTMLLIElement.prototype.oToggleList = function (offset, mode) {
    let pnode = this.closest('ul, ol');
    if (!pnode) return;
    const restoreCursor = preserveCursor(this.ownerDocument);
    switch (getListMode(pnode) + mode) {
        case 'OLCL':
        case 'ULCL':
            pnode.classList.add('checklist');
            for (let li = pnode.firstElementChild; li !== null; li = li.nextElementSibling) {
                if (li.style.listStyle != 'none') {
                    li.style.listStyle = null;
                    if (!li.style.all) li.removeAttribute('style');
                }
            }
            setTagName(pnode, 'UL');
            break;
        case 'CLOL':
        case 'CLUL':
            toggleClass(pnode, 'checklist');
        case 'OLUL':
        case 'ULOL':
            setTagName(pnode, mode);
            break;
        default:
            // toggle => remove list
            let node = this;
            while (node) {
                node = node.oShiftTab(offset);
            }
    }
    restoreCursor();
    return false;
};
