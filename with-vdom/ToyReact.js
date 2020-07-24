// 抽离 element node 逻辑
let childrenSymbol = Symbol("children")
class ElementWrapper {
  constructor(type) {
    this.type = type
    this.props = Object.create(null)
    this[childrenSymbol] = []
    this.children = []
  }

  // get children() {
  //   return this[childrenSymbol].map((chid) => child.vdom)
  // }

  setAttribute(name, value) {
    this.props[name] = value
  }

  appendChild(vchild) {
    this[childrenSymbol].push(vchild)
    this.children.push(vchild.vdom)
  }

  mountTo(range) {
    this.range = range

    let placeholder = document.createComment("placeholder")
    let endRange = document.createRange()
    endRange.setStart(range.endContainer, range.endOffset)
    endRange.setEnd(range.endContainer, range.endOffset)
    endRange.insertNode(placeholder)
    range.deleteContents()

    // vdom 转 实dom
    let element = document.createElement(this.type)

    // 添加属性
    for (let name in this.props) {
      let value = this.props[name]

      if (name.match(/^on([\s\S]+)$/)) {
        let event = RegExp.$1.replace(/^[\s\S]/, (s) => s.toLowerCase())
        element.addEventListener(event, value)
      }

      if (name === "className") {
        name = "class"
      }

      element.setAttribute(name, value)
    }

    // 下级元素
    for (let child of this.children) {
      let range = document.createRange()
      if (element.children.length) {
        range.setStartAfter(element.lastChild)
        range.setEndAfter(element.lastChild)
      } else {
        range.setStart(element, 0)
        range.setEnd(element, 0)
      }
      child.mountTo(range)
    }

    range.insertNode(element)
  }

  get vdom() {
    return this
    //   let vChildren = this.children.map((child) => child.vdom)
    //   return {
    //     type: this.type,
    //     props: this.props,
    //     children: vChildren,
    //   }
    // }
  }
}

// 抽离 text node 逻辑
class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
    this.type = "#text"
    this.children = []
    this.props = Object.create(null)
  }

  mountTo(range) {
    this.range = range

    range.deleteContents()
    range.insertNode(this.root)
  }

  get vdom() {
    // return {
    //   type: "#text",
    //   props: this.props,
    //   children: [],
    // }
    return this
  }
}

// 抽离自定义组件的逻辑
export class Component {
  constructor() {
    this.children = []
    this.props = Object.create(null)
  }

  get type() {
    return this.constructor.name
  }

  get vdom() {
    return this.render().vdom
  }

  appendChild(vchild) {
    this.children.push(vchild)
  }

  mountTo(range) {
    this.range = range
    this.update()
  }

  // 视图更新逻辑
  update() {
    let vdom = this.vdom
    if (this.oldVdom) {
      // 判断单一节点
      let isSameNode = (node1, node2) => {
        if (node1.type === "ol" || node1.type === "li") {
          return false
        }
        // 判断类型
        if (node1.type !== node1.type) {
          return false
        }

        // 判断属性长度
        if (
          Object.keys(node1.props).length !== Object.keys(node2.props).length
        ) {
          return false
        }

        // 判断属性值
        for (let name in node1.props) {
          // if (
          //   typeof node1.props[name] === "function" &&
          //   typeof node2.props[name] === "function" &&
          //   node1.props[name].toString() === node2.props[name].toString()
          // ) {
          //   continue
          // }

          // if next and last value are objects
          // if both are pure objects or array and JSON.stringify valus are equal, continue and loop
          // if both are Function and toString values are equal, continue and loop
          if (
            Object.prototype.toString.call(node1.props[name]) === Object.prototype.toString.call(node.props[name]) &&
            ( JSON.stringify(node1.props[name]) === JSON.stringify(node2.props[name] || 
              node1.props[name].toString() === node2.props[name].toString())
            )
          ) {
            continue
          }

          // if next and last values are not equal
          if (node1.props[name] !== node2.props[name]) {
            return false
          }
        }

        return true
      }

      // 判断整个树
      let isSameTree = (node1, node2) => {
        if (!isSameNode(node1, node2)) {
          return false
        }
        if (node1.children.length !== node2.children.length) {
          return false
        }

        for (let i = 0; i < node1.children.length; i++) {
          if (!isSameTree(node1.children[i], node2.children[i])) {
            return false
          }
        }

        return true
      }

      let replace = (newTree, oldTree, indent) => {
        // console.log(indent + "new", vdom)
        // console.log(indent + "old", this.vdom)
        if (isSameTree(newTree, oldTree)) {
          return
        }

        if (!isSameNode(newTree, oldTree)) {
          newTree.mountTo(oldTree.range)
        } else {
          for (let i = 0; i < newTree.children.length; i++) {
            replace(newTree.children[i], oldTree.children[i], " " + indent)
          }
        }
      }
      // 判断新旧状态对比
      replace(vdom, this.oldVdom, "")
    } else {
      vdom.mountTo(this.range)
    }
    // this.vdom = vdom
    this.oldVdom = vdom
  }

  // 状态更新逻辑
  setState(state) {
    // 数据合并操作
    let merge = (oldState, newState) => {
      for (let p in newState) {
        if (typeof newState[p] === "object" && newState[p] !== null) {
          if (typeof oldState[p] !== "object") {
            if (newState[p] instanceof Array) {
              oldState[p] = []
            } else {
              oldState[p] = {}
            }
          }
          merge(oldState[p], newState[p])
        } else {
          oldState[p] = newState[p]
        }
      }
    }

    if (!this.state && state) {
      this.state = {}
    }
    merge(this.state, state)
    this.update()
  }

  setAttribute(name, value) {
    if (name.match(/^on([\s\S]+)$/)) {
    }
    this.props[name] = value
    this[name] = value
  }
}

export const ToyReact = {
  createElement(type, attributes, ...children) {
    // 根据 type 创建相应的 dom 实例
    let element
    if (typeof type === "string") {
      element = new ElementWrapper(type)
    } else {
      element = new type()
    }

    // 将 attributes 添加至 dom 实例
    for (let name in attributes) {
      element.setAttribute(name, attributes[name])
    }

    // 将子级追加到 dom 实例
    let insertChildren = (children) => {
      for (let child of children) {
        if (typeof child === "object" && child instanceof Array) {
          insertChildren(child)
        } else {
          if (child === null || child == void 0) {
            child = ""
          }
          // 只要不是属于三种节点的，都先暴力解决一下，输出字符串
          if (
            !(child instanceof Component) &&
            !(child instanceof ElementWrapper) &&
            !(child instanceof TextWrapper)
          ) {
            child = String(child)
          }
          // 处理 text node 情况
          if (typeof child === "string") {
            child = new TextWrapper(child)
          }
          element.appendChild(child)
        }
      }
    }
    insertChildren(children)

    return element
  },
  render(vdom, element) {
    let range = document.createRange()
    if (element.children.length) {
      range.setStartAfter(element.lastChild)
      range.setEndAfter(element.lastChild)
    } else {
      range.setStart(element, 0)
      range.setEnd(element, 0)
    }

    vdom.mountTo(range)
  },
}
