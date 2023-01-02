﻿// https://github.com/jooj123/js-tree-utils/blob/master/src/node.js

export class TreeNode<TKey, TValue> {
    key: TKey;
    value: TValue;
    left: TreeNode<TKey, TValue> = null;
    right: TreeNode<TKey, TValue> = null;
    height = 1;

    constructor(key: TKey, value: TValue) {
        this.key = key;
        this.value = value;
    }
}
