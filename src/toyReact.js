class Component{
    constructor(){
        this.children = [];
    }

    setAttribute(name, value){
        this[name] = value;
    }

    mountTo(parent){
        const vDom = this.render();
        vDom.mountTo(parent)
    }

    appendChild(vChild){
        this.children.push(vChild);
    }
}

class DOMElementComponent extends Component{
    constructor(type){
        super();
        this.root = document.createElement(type);
    }

    setAttribute(name, value){
        this.root.setAttribute(name, value);
    }

    appendChild(vChild){
        vChild.mountTo(this.root)
    }

    mountTo(parent){
        parent.appendChild(this.root);
    }
}


class TextElementComponent extends Component{
    constructor(text){
        super();
        this.root = document.createTextNode(text);
    }
    
    mountTo(parent){
        parent.appendChild(this.root);
    }
}

function createElement(type, props, ...children){
    console.log(type, children)
    let el;

    if(typeof type === 'string')
        el = new DOMElementComponent(type);
    else{
        el = new type();
    }
    // props
    for(let key in props){
        el.setAttribute(key, props[key]);
    }

    // children
    function flatChildren(children){
        for(let child of children){
            if(Array.isArray(child)){
                flatChildren(child);
            }else{
                let vChild;
                if(typeof child === 'string'){
                    vChild = new TextElementComponent(child);
                }
                else if(Object.prototype.toString.call(child) === '[object Object]' && child instanceof Component ){
                    vChild = child;
                }
                else if(Object.prototype.toString.call(child) === '[object Function]'){
                    vChild = child();
                    
                }
                else{
                    // invalid component fallover
                    vChild = String(child);
                }
                el.appendChild(vChild);
            }
        }
    }

    flatChildren(children);

    return el;
}

function render(vChild, parent){
    vChild.mountTo(parent);
}

export default {
    createElement,
    render,
    Component
}