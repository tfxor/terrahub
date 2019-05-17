'use strict';

class AbstractDependencyStrategy {

    setStrategy(config) {
        throw new Error('DependencySetStrategy must be overwritten!')
    }

    getExecutionList() {
        throw new Error('DependencyStrategy must be set!')
        //common code
        
    }
}

module.exports = AbstractDependencyStrategy;