import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Navbar } from './components/Navbar';

class App extends React.Component<{}, {}> {

    render() {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                overflow: 'scroll'
            }}>
                <Navbar/>
                {this.props.children}
            </div>
        )
    }
    
};

ReactDOM.render(<App/>, document.getElementById("react-content"));