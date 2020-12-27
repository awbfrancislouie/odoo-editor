"use strict";

import {
    createList,
    getListMode,
    isUnbreakable,
    preserveCursor,
    isBlock,
    isVisible,
} from "../utils/utils.js";

Text.prototype.oShiftTab = function (offset) {
    return this.parentElement.oShiftTab(0);
};

HTMLElement.prototype.oShiftTab = function (offset = undefined) {
    if (!isUnbreakable(this)) {
        return this.parentElement.oShiftTab(offset);
    }
    return false;
};

// returns: is still in a <LI> nested list
HTMLLIElement.prototype.oShiftTab = function (offset) {
    let li = this;
    if (li.nextElementSibling) {
        let ul = createList(getListMode(li.parentElement));
        while (li.nextSibling) {
            ul.append(li.nextSibling);
        }
        if (li.parentNode.parentNode.tagName === 'LI') {
            let lip = document.createElement("li");
            lip.append(ul);
            lip.style.listStyle = "none";
            li.parentNode.parentNode.after(lip);
        } else {
            li.parentNode.after(ul);
        }
    }

    const restoreCursor = preserveCursor();
    if (li.parentNode.parentNode.tagName === 'LI') {
        let toremove = !li.previousElementSibling ? li.parentNode.parentNode : null;
        li.parentNode.parentNode.after(li);
        if (toremove) {
            toremove.remove();
        }
        restoreCursor();
        return li;
    } else {
        let ul = li.parentNode;
        let p;
        while (li.firstChild) {
            if (isBlock(li.firstChild)) {
                p = isVisible(p) && ul.after(p) && undefined;
                ul.after(li.firstChild)
            } else {
                p = p || document.createElement('P');
                p.append(li.firstChild);
            }
        }
        if (isVisible(p))
            ul.after(p);

        restoreCursor(new Map([[li, ul.nextSibling]]));
        li.remove();
        if (!ul.firstElementChild) {
            ul.remove();
        }
    }
    return false;
};
