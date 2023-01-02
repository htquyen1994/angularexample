import {TreeNode} from './TreeNode';

export class BinarySearchTree<TKey, TValue> {

    options: any;
    root: TreeNode<TKey, TValue>;

    constructor(options?: any) {
        this.options = options || {};
        this.root = null;
    }

    insert(key: TKey, value: TValue) {

        const node = new TreeNode(key, value);
        let current: TreeNode<TKey, TValue>;

        if (this.root === null) {
            this.root = node;
            return;
        }

        current = this.root;

        while (true) {
            if (key < current.key) {
                if (current.left === null) {
                    current.left = node;
                } else {
                    current = current.left;
                }

            } else if (key > current.key) {

                if (current.right === null) {
                    current.right = node;
                } else {
                    current = current.right;
                }
            } else {
                break;
            }
        }
    }


    // optionally search from a specific node
    contains(key: TKey, node: TreeNode<TKey, TValue>): boolean {
        let current = node;

        // search from the root node is node not specfied
        if (typeof current === 'undefined') {
            current = this.root;
        }

        if (current === null) {
            return false; // nothing found
        }

        if (key === current.key) {
            return true;
        } else if (key > current.key) {
            return this.contains(key, current.right);
        } else if (key < current.key) {
            return this.contains(key, current.left);
        }

        return false;
    }


    // optionally search from a specific node
    find(key: TKey, node: TreeNode<TKey, TValue>): TValue {
        let current = node;

        // search from the root node is node not specfied
        if (typeof current === 'undefined') {
            current = this.root;
        }

        if (current === null) {
            return null; // nothing found
        }

        if (key === current.key) {
            return current.value;
        } else if (key > current.key) {
            return this.find(key, current.right);
        } else if (key < current.key) {
            return this.find(key, current.left);
        }

        return null;
    }

    inOrder(): TreeNode<TKey, TValue>[] {
        var list = Array<TreeNode<TKey, TValue>>();
        this.traverse(this.root,
            (node: TreeNode<TKey, TValue>) => {
                //console.log('Key: %s Value: %s', node.key, node.value);
                list.push(node);
            });

        return list;
    }

    traverse(node: TreeNode<TKey, TValue>, func: (nd: TreeNode<TKey, TValue>) => void) {
        if (node !== null) {
            if (node.left !== null) {
                this.traverse(node.left, func);
            }

            func.call(this, node);

            if (node.right !== null) {
                this.traverse(node.right, func);
            }
        }
    }

    get minKey() {
        return  this.minNode(this.root).key;
    };

    minNode(node:TreeNode<TKey, TValue>) {

        var current = node;
        if (current === null) {
            return null;
        }

        while (current.left !== null) {
            current = current.left;
        }

        return current;
    };


   get maxKey() {


        return this.maxNode(this.root).key;
    };



    maxNode(node: TreeNode<TKey, TValue>) {

        var current =  node;
        if (current === null) {
            return null;
        }

        while (current.right !== null) {
            current = current.right;
        }

        return current;
    };
    get size() {
        var count = 0;

        this.traverse(this.root,
            (node: TreeNode<TKey, TValue>) => {
                count++;
            });

        return count;
    };
}
