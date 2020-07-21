import ToyReact from './toyReact'


class MyComponent extends ToyReact.Component{
    render(){
        console.log('children: ', this.children)
        return <div name="a">
            <span>hello</span>
            <span>world</span>
            <div>{this.children}</div>
        </div>
    }
}


const root = document.getElementById('root');

const app = <MyComponent >
    <span>hello</span>
    {() => <span>123</span>}  
</MyComponent>

ToyReact.render(app, root);