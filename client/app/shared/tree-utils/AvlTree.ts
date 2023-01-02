import {TreeNode} from './TreeNode';
import {BinarySearchTree} from './BinarySearchTree';

export class AvlTree<TKey, TValue> extends BinarySearchTree<TKey, TValue> {

	options: any;
	root: TreeNode<TKey, TValue>;

	constructor(options?: any) {
		super(options);
		this.options = options || [];
		this.root = null;
	}

	height(node: TreeNode<TKey, TValue>) {
		if (!node) {
			return 0;
		}
		return node.height;
	}

	/*
	 * Rotate Right
	 *
	 *     C (Height 2)
	 *    /
	 *   B (Height 1)      B
	 *  /                 / \
	 * A (Height 0)   => A   C
	 */
	rightRotate(node: TreeNode<TKey, TValue>) {
		var left = node.left;
		var rightOfLeft = left.right;

		// perform rotation
		left.right = node;
		node.left = rightOfLeft;

		// update heights
		node.height = Math.max(this.height(node.left), this.height(node.right)) + 1;
		left.height = Math.max(this.height(left.left), this.height(left.right)) + 1;

		// return new root node
		return left;
	}


	leftRotate(node: TreeNode<TKey, TValue>) {
		var right = node.right;
		var leftOfRight = right.left;

		// perform rotation
		right.left = node;
		node.right = leftOfRight;

		// update heights
		node.height = Math.max(this.height(node.left), this.height(node.right)) + 1;
		right.height = Math.max(this.height(right.left), this.height(right.right)) + 1;

		// return new root node
		return right;
	}

	getBalance = function (node: TreeNode<TKey, TValue>) {
		if (!node) {
			return 0;
		}

		return this.height(node.left) - this.height(node.right);
	};

	insert(key: TKey, value: TValue) {
		this.root = this.insertNode(this.root, key, value);
	}

	insertNode = function (node: TreeNode<TKey, TValue>, key: TKey, value: TValue) {
		let balance = 0;

		if (node === null) {
			return new TreeNode(key, value);
		}

		// console.log('Key: %s Node Key: %s', key, node.key);

		if (key < node.key) {
			node.left = this.insertNode(node.left, key, value);
		} else {
			node.right = this.insertNode(node.right, key, value);
		}

		// update height of this ancestor node
		node.height = Math.max(this.height(node.left), this.height(node.right)) + 1;

		// Get the balance factor of this ancestor node to check whether
		// this node became unbalanced
		balance = this.getBalance(node);

		// If node becomes unbalanced there is 4 cases

		// left left case
		if (balance > 1 && key < node.left.key) {
			return this.rightRotate(node);
		}

		// right right case
		if (balance < -1 && key > node.right.key) {
			return this.leftRotate(node);
		}

		// left right case
		if (balance > 1 && key > node.left.key) {
			node.left = this.leftRotate(node.left);
			return this.rightRotate(node);
		}

		// right left case
		if (balance < -1 && key < node.right.key) {
			node.right = this.rightRotate(node.right);
			return this.leftRotate(node);
		}

		return node;
	};

	remove(key: TKey) {
		// console.warn("AvlTree remove is not implemented");

		this.deleteNode(this.root, key);
	}

	private deleteNode(node: TreeNode<TKey, TValue>, key: TKey): TreeNode<TKey, TValue> {

		if (node === null)
			return node;

		if (key < node.key) {
			node.left = this.deleteNode(node.left, key);
		} else if (key > node.key) {
			node.right = this.deleteNode(node.right, key);
		} else {

			if (!(node.left) || !(node.right)) {
				let temp: TreeNode<TKey, TValue> = !(node.left) ? node.right : node.left;


				if (!(temp)) {
					temp = node;
					node = null;

				} else {
					node = temp;
				}
			} else {
				let temp: TreeNode<TKey, TValue> = this.minNode(node.right);

				node.key = temp.key;
				node.value = temp.value;

				node.right = this.deleteNode(node.right, temp.key);
			}

		}

		if (node === null) {
			return node;
		}

		node.height = Math.max(this.height(node.left), this.height(node.right)) + 1;

		let balance = this.getBalance(node);

		if (balance > 1 && this.getBalance(node.left) >= 0) {
			return this.rightRotate(node);
		}

		if (balance > 1 && this.getBalance(node.left) < 0) {
			node.left = this.leftRotate(node.left);
			return this.rightRotate(node);
		}

		if (balance < -1 && this.getBalance(node.right) <= 0) {
			return this.leftRotate(node);
		}

		if (balance < -1 && this.getBalance(node.right) > 0) {
			node.right = this.rightRotate(node.right);
			return this.leftRotate(node);
		}

		return node;
	}
}

// inherit from BinarySearchTree as things like Searching are the same
//AvlTree.prototype = Object.create(BinarySearchTree.prototype);
