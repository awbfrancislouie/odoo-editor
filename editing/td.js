"use strict";

HTMLTableCellElement.prototype.oShiftEnter = function () {
    let node = this.firstChild;
    if (!this.firstChild) {
        node = document.createElement('BR');
        this.append(node);
    }
    return node.oShiftEnter();
};

HTMLTableCellElement.prototype.oEnter = HTMLTableCellElement.prototype.oShiftEnter;
