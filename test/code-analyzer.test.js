import assert from 'assert';
import {subCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is parsing a simple function correctly', () => {
        assert.equal(
            JSON.stringify(subCode('let a =1; \n' +
                'function test(x)\n' +
                '{\n' +
                'let b = x+1;\n' +
                '}', '10')),
            '{"code":["let a =1; ","function test(x)","{","\\n","}"],"color":["white","white","white","white","white"]}'
        );
    });

    it('is parsing a function with while correctly', () => {
        assert.equal(
            JSON.stringify(subCode('let a =1;\n' +
                '    function test(x)\n' +
                '    {\n' +
                '        let b = x+1;\n' +
                '        while(2<4){\n' +
                '            x=x+1;\n' +
                '        }\n' +
                '    }', '10')),
            '{"code":["let a =1;","    function test(x)","    {","\\n","while( (2<4)){","x=(x+1);","        }","    }"],"color":["white","white","white","white","white","white","white","white"]}'
        );
    });


    it('is parsing a function with if correctly', () => {
        assert.equal(
            JSON.stringify(subCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '        return x + y + z + c;\n' +
                '}\n' +
                'else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}\n', '1, 2, 3')),
            '{"code":["function foo(x, y, z){","\\n","\\n","\\n","    ","if( (((x+1)+y)<z)){","\\n","return (((x+y)+z)+(0+5)) ;","}","else {","\\n","return (((x+y)+z)+((0+z)+5)) ;","    }","}",""],"color":["white","white","white","white","white","red","white","white","white","white","white","white","white","white","white"]}'
        );
    });


    it('is parsing a function with nested if correctly', () => {
        assert.equal(
            JSON.stringify(subCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                'if(b<z){\n' +
                'c=300;\n' +
                'return x + y + z + c;\n' +
                '\n' +
                '}\n' +
                '        return x + y + z + c;\n' +
                '    } \n' +
                '\n' +
                '}', '1, 2, 3')),
            '{"code":["function foo(x, y, z){","\\n","\\n","\\n","    ","if( (((x+1)+y)<z)){","\\n","if( (((x+1)+y)<z)){","\\n","return (((x+y)+z)+300) ;","","}","return (((x+y)+z)+(0+5)) ;","    } ","","}"],"color":["white","white","white","white","white","red","white","red","white","white","white","white","white","white","white","white"]}'
        );
    });

    it('is parsing a function with break correctly', () => {
        assert.equal(
            JSON.stringify(subCode('function foo(x, y, z){\n' +
                'while (x<2){\n' +
                'break;\n' +
                '} \n' +
                '\n' +
                '}', '1, 2, 3')),
            '{"code":["function foo(x, y, z){","while( (x<2)){","break;","} ","","}"],"color":["white","white","white","white","white","white"]}'
        );
    });
    it('is parsing a function with update correctly', () => {
        assert.equal(
            JSON.stringify(subCode('function foo(x, y, z){\n' +
                'let a = x++;\n' +
                '}', '1, 2, 3')),
            '{"code":["function foo(x, y, z){","\\n","}"],"color":["white","white","white"]}'
        );
    });

    it('is parsing a global assignment correctly', () => {
        assert.equal(
            JSON.stringify(subCode('let a=1;\n' +
                'a=5;\n' +
                'function foo(x, y, z){\n' +
                'let b = !x;\n' +
                'return b\n' +
                '}', 'true, "hello", 3')),
            '{"code":["let a=1;","a=5;","function foo(x, y, z){","\\n","return !x ;","}"],"color":["white","white","white","white","white","white"]}'
        );
    });

    it('is parsing a member assignment correctly', () => {
        assert.equal(
            JSON.stringify(subCode('let a=[1, 2, 3]\n' +
                'function foo(x){\n' +
                'x[0]=a[1];\n' +
                '}', '[4, 5, 6]')),
            '{"code":["let a=[1, 2, 3]","function foo(x){","x[0] =2;","}"],"color":["white","white","white","white"]}'
        );
    });

    it('is parsing a member assignment of local and global correctly', () => {
        assert.equal(
            JSON.stringify(subCode('let a=[1, 2, 3]\n' +
                'a[0]=6;\n' +
                'function foo(x){\n' +
                'let b = [2];\n' +
                'b[0]=false;\n' +
                'x[0]=a[1];\n' +
                '}', '[4, 5, 6]')),
            '{"code":["let a=[1, 2, 3]","a[0] =6;","function foo(x){","\\n","\\n","x[0] =2;","}"],"color":["white","white","white","white","white","white","white"]}'
        );
    });

    it('use of global in assignment, prefix update', () => {
        assert.equal(
            JSON.stringify(subCode('let a=9;\n' +
                'function foo(x){\n' +
                'let b = ++y;\n' +
                'return x+a;\n' +
                '}', '4, 5, 6')),
            '{"code":["let a=9;","function foo(x){","\\n","return (x+9) ;","}"],"color":["white","white","white","white","white"]}'
        );
    });

    it('use of special assign operator', () => {
        assert.equal(
            JSON.stringify(subCode('let a=9;\n' +
                'a+=5;\n' +
                'function foo(x){\n' +
                'let b = 8;\n' +
                'b+=4;\n' +
                'x-=2;\n' +
                'return x+a;\n' +
                '}', '5')),
            '{"code":["let a=9;","a+=5;","function foo(x){","\\n","\\n","x-=2;","return (x+(9 + 5)) ;","}"],"color":["white","white","white","white","white","white","white","white"]}'
        );
    });

    it('use of member param', () => {
        assert.equal(
            JSON.stringify(subCode('let a=9;\n' +
                'function foo(x){\n' +
                'a=x[0];\n' +
                'return a;\n' +
                '}', '[5]')),
            '{"code":["let a=9;","function foo(x){","a=x[0];","return x[0] ;","}"],"color":["white","white","white","white","white"]}'
        );
    });
    it('use of array', () => {
        assert.equal(
            JSON.stringify(subCode('let a=[1, 2, 3];\n' +
                'function foo(x){\n' +
                'let a = [2, "t", true];\n' +
                'return x;\n' +
                '}', '[5]')),
            '{"code":["let a=[1, 2, 3];","function foo(x){","\\n","return x ;","}"],"color":["white","white","white","white","white"]}'
        );
    });

    it('a lot of if', () => {
        assert.equal(
            JSON.stringify(subCode('let a=6;\n' +
                'function foo(x){\n' +
                'let b = a+8;\n' +
                'if(b<x){\n' +
                'return x+b;\n' +
                '}\n' +
                'else if(b<x*45){\n' +
                'if(b<x*20){\n' +
                'return x+b;\n' +
                '}\n' +
                'return x+4*b;\n' +
                '}\n' +
                'else {\n' +
                'return x+5*b;\n' +
                '}\n' +
                '\n' +
                '}', '1')),
            '{"code":["let a=6;","function foo(x){","\\n","if( ((6+8)<x)){","return (x+(6+8)) ;","}","else if( ((6+8)<(x*45))){","if( ((6+8)<(x*20))){","return (x+(6+8)) ;","}","return (x+(4*(6+8))) ;","}","else {","return (x+(5*(6+8))) ;","}","","}"],"color":["white","white","white","red","white","white","green","green","white","white","white","white","white","white","white","white","white"]}'
        );
    });

    it('a lot of if', () => {
        assert.equal(
            JSON.stringify(subCode('let a = [2, 3];\n' +
                'a= [3, 5];\n' +
                'function foo(x){\n' +
                'let b = [3, 4];\n' +
                'b=[2, 6];\n' +
                'x=[1, 4];\n' +
                'return x;\n' +
                '}', '1')),
            '{"code":["let a = [2, 3];","a=[3];","function foo(x){","\\n","\\n","x=[1];","return x ;","}"],"color":["white","white","white","white","white","white","white","white"]}'
        );
    });
});
