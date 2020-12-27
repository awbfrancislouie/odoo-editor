"use strict";

import {
    closestBlock,
    endPos,
    getListMode,
    isBlock,
    isVisibleEmpty,
    moveNodes,
    preserveCursor,
} from "./utils.js";

export function areSimilarElements(node, node2) {
    if (!node || !node2 || node.nodeType !== Node.ELEMENT_NODE || node2.nodeType !== Node.ELEMENT_NODE) {
        return false;
    }
    if (node.tagName !== node2.tagName) {
        return false;
    }
    for (const att of node.attributes) {
        const att2 = node2.attributes[att.name];
        if ((att2 && att2.value) !== att.value) {
            return false;
        }
    }
    for (const att of node2.attributes) {
        const att2 = node.attributes[att.name];
        if ((att2 && att2.value) !== att.value) {
            return false;
        }
    }
    function isNotNoneValue(value) {
        return value && value !== 'none';
    }
    if (isNotNoneValue(getComputedStyle(node, ':before').getPropertyValue('content'))
            || isNotNoneValue(getComputedStyle(node, ':after').getPropertyValue('content'))
            || isNotNoneValue(getComputedStyle(node2, ':before').getPropertyValue('content'))
            || isNotNoneValue(getComputedStyle(node2, ':after').getPropertyValue('content'))) {
        return false;
    }
    if (node.tagName=='LI' && node.style.listStyle=="none" && node2.style.listStyle=="none") {
        let mode = undefined;
        return getListMode(node.lastElementChild) == getListMode(node2.firstElementChild);
    }
    return (['UL', 'OL'].includes(node.tagName) || !isBlock(node)) && !isVisibleEmpty(node) && !isVisibleEmpty(node2);
}


class Sanitize {
    constructor(root) {
        this.root = root;
        this.parse(root);
    }

    parse(node) {
        node = closestBlock(node);
        if (['UL', 'OL'].includes(node.tagName)) {
            node = node.parentElement;
        }
        this._parse(node);
    }

    _parse(node) {
        if (!node) {
            return;
        }

        // Merge identical elements together
        while (areSimilarElements(node, node.previousSibling)) {
            let restoreCursor = preserveCursor();
            let nodeP = node.previousSibling;
            moveNodes(...endPos(node.previousSibling), node);
            restoreCursor();
            node = nodeP;
        }

        // FIXME not parse out of editable zone...
        this._parse(node.firstChild);
        this._parse(node.nextSibling);
    }
}

export function sanitize(root) {
    new Sanitize(root);
    return root;
}
