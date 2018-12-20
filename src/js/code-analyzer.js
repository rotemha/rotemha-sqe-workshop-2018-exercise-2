import * as esprima from 'esprima';
var escodegen = require('escodegen');
const typeArr = ['BlockStatement','VariableDeclaration','ExpressionStatement','IfStatement','ReturnStatement','BreakStatement','ContinueStatement','WhileStatement'];
const typeExp = ['Identifier','Literal','UnaryExpression','BinaryExpression','LogicalExpression','UpdateExpression', 'ArrayExpression', 'MemberExpression'];




let locals = [];
let params = [];
let globals=[];
let lineNums=[];
let codeAfterSub = [];
let inIf = false;
let first = true;

const blockHandler = (block)=>{
    if(first===false){
        allocatecell();
        for(let x in block.body){
            traverseFunc(block.body[x]);
        }
        deallocatecell();}
    else{
        first=false;
        for(let x in block.body){
            traverseFunc(block.body[x]);
        }
    }

};

const allocatecell=()=>{
    for (let x in globals){
        globals[x].value.push(globals[x].value.slice(-1)[0]);
    }
    for (let x in params){
        params[x].value.push(params[x].value.slice(-1)[0]);
    }
    for (let x in locals){
        locals[x].value.push(locals[x].value.slice(-1)[0]);
    }
};

const deallocatecell=()=>{
    for (let x in globals){
        globals[x].value.splice(-1,1);
    }
    for (let x in params){
        params[x].value.splice(-1,1);
    }
    for (let x in locals){
        locals[x].value.splice(-1,1);
    }
};
const whileHandler = (whilei)=>{
    let test = whilei.test;
    let ln = (test.loc.start.line);
    let sub = findDupl(test);
    codeAfterSub[ln-1] = 'while( '.concat(sub,'){');
    traverseFunc(whilei.body);
};

const ifHandler = (ifStatement)=>{
    let test = ifStatement.test;
    let dit = ifStatement.consequent;
    let dif = ifStatement.alternate;
    let ln = (test.loc.start.line);
    let sub = findDupl(test);
    if(inIf===true){codeAfterSub[ln-1] = 'else if( '.concat(sub,'){');}
    else {codeAfterSub[ln-1] = 'if( '.concat(sub,'){');}
    let values = createValues();
    let out = eval(values.concat(sub,';'));
    if (out===true)
        lineNums.push({line: ln, color:'green'});
    else  lineNums.push({line: ln, color:'red'});
    inIf=false;
    traverseFunc(dit);
    if(dif!==null){
        inIf=true;
        traverseFunc(dif);}
    inIf=false;
};

const returnHandler = (ret)=>{
    let str = findDupl(ret.argument);
    codeAfterSub[ret.loc.start.line-1]= 'return '.concat(str , ' ;');
};

const bcHandler = (bc)=>{
    bc.toString();
    return;
};
const createValues=()=>{
    let str = '';
    for (let x in globals){
        str = str.concat('let ', globals[x].id, ' = ', ((globals[x].value).slice(-1))[0], ';\n');
    }
    for (let x in params){
        str = str.concat('let ', params[x].id, ' = ', ((params[x].value).slice(-1))[0], ';\n');
    }
    return str;};


const findLocal = (str)=>{
    for(let x in locals){
        if (locals[x].id===str)
            return x;}
    return -1;
};

const findGlobal = (str)=>{
    for(let x in globals){
        if (globals[x].id===str)
            return x;}
    return -1;
};

const findParam = (str)=>{
    for(let x in params){
        if (params[x].id===str)
            return x;}
    return -1;
};


const idHandler=(decl)=>{
    let index=findLocal(decl.name);
    if(index>=0)
    {return ((locals[index].value).slice(-1))[0];}
    else if(findGlobal(decl.name)>=0) return ((globals[findGlobal(decl.name)].value).slice(-1))[0];
    //else if(findParam(decl.name)>=0) return ((params[findParam(decl.name)].value).slice(-1))[0];
    else return decl.name;
};

const lHandler=(decl)=>{
    return decl.raw;
};

const unHandler=(decl)=>{
    return decl.operator.concat(findDupl(decl.argument));
};

const blHandler=(decl)=>{
    return '('.concat(findDupl(decl.left),decl.operator,findDupl(decl.right),')');
};

const arrHandler = (decl)=>{
    let ret = '[';
    let i=0;
    //for(i=0;i<decl.elements-1;i++){
    //  ret = ret.concat(findDupl(decl.elements[i]),', ');
    //}
    return ret.concat(findDupl(decl.elements[i]),']');
};

const upHandler=(decl)=>{
    if(decl.prefix===true)
        return decl.operator.concat(findDupl(decl.argument));
    else return  findDupl(decl.argument).concat(decl.operator);
};

const memberHandler=(decl)=>{
    let who = decl.object.name;
    let where = findDupl(decl.property);
    if(findParam(who)>=0){
        return who.concat('[',where,']');
    }
    let values = createValues();
    let evali = eval(values.concat(who,'[',where,']',';'));
    return stringifier(evali,'[');

};

const minfuncArr = [idHandler,lHandler,unHandler,blHandler,blHandler,upHandler, arrHandler, memberHandler];

const findDupl = (decl)=>{
    let index = typeExp.indexOf(decl.type);
    return minfuncArr[index](decl);
};

//only for locals
const varDeclHandler = (decl)=>{
    for(let x in decl.declarations) {
        let ret = findDupl(decl.declarations[x].init);
        locals.push({id: decl.declarations[x].id.name, value: [ret]});
        codeAfterSub[(decl.declarations[x].loc.start.line)-1]='\n';
    }
};

const assignHelper = (which,name,operator,value)=>{
    if(operator==='='){
        return value;
    }
    let newOpr = operator.slice(0,operator.length-1);
    if(which==='l'){
        let index = findLocal(name);
        return '('.concat(((locals[index].value.slice(-1))[0]),' ',newOpr,' ',value,')');
    }
    else if(which==='g'){
        let index = findGlobal(name);
        return '('.concat(((globals[index].value.slice(-1))[0]),' ',newOpr,' ',value,')');
    }
    else{let index = findParam(name);
        '('.concat(((params[index].value.slice(-1))[0]),' ',newOpr,' ',value,')');}

};

const assignmentHandler = (assignment)=>{let assign = assignment.expression;
    if(assign.left.type!=='MemberExpression') {
        let ret = findDupl(assign.right);
        if(findLocal(assign.left.name)>=0){
            let index = findLocal(assign.left.name);let fresh = assignHelper('l',assign.left.name,assign.operator,ret);(locals[index].value).pop();
            (locals[index].value).push(fresh); codeAfterSub[(assign.loc.start.line)-1]='\n';
        }
        else if(findGlobal(assign.left.name)>=0){let index = findGlobal(assign.left.name);
            let fresh = assignHelper('g',assign.left.name,assign.operator,ret);
            (globals[index].value).pop();(globals[index].value).push(fresh);
            codeAfterSub[(assign.loc.start.line)-1]=(assign.left.name).concat(assign.operator, ret,';');
        }
        else {
            let index = findParam(assign.left.name);
            let fresh = assignHelper('p',assign.left.name,assign.operator,ret);
            (params[index].value).pop();(params[index].value).push(fresh);
            codeAfterSub[(assign.loc.start.line)-1]=(assign.left.name).concat(assign.operator, ret,';');
        }} else memAssignment(assign);
};

const memAssignment = (assign)=>{
    let what = findDupl(assign.right);let who = assign.left.object.name;let where = findDupl(assign.left.property);let num = eval(createValues().concat(where,';'));
    if(findLocal(who)>=0){
        let index = findLocal(who);
        let arr = getArgs(locals[index].value.slice(-1)[0]);
        let fresh = assignHelper('l',arr[num],assign.operator,what);
        arr[num]=fresh;(locals[index].value).pop();let a = '['.concat((arr.toString()),']');
        (locals[index].value).push(a);
        codeAfterSub[(assign.loc.start.line)-1]='\n';
    }
    else if(findGlobal(who)>=0){
        let index = findGlobal(who);
        let arr = getArgs(globals[index].value.slice(-1)[0]);
        let fresh = assignHelper('g',arr[num],assign.operator,what);
        arr[num]=fresh;(globals[index].value).pop();let a = '['.concat((arr.toString()),']');(globals[index].value).push(a);
        codeAfterSub[(assign.loc.start.line)-1]=who.concat('[',where,'] ',assign.operator, fresh,';');
    }
    else {let index = findParam(who);let arr = getArgs(params[index].value.slice(-1)[0]);let fresh = assignHelper('p',arr[num],assign.operator,what);arr[num]=fresh;(params[index].value).pop();let a = '['.concat((arr.toString()),']');(params[index].value).push(a);codeAfterSub[(assign.loc.start.line)-1]=who.concat('[',where,'] ',assign.operator, fresh,';');
    }};

const getArgs = (args)=>{
    let reg = /(\u005b)("[ -!#-~]*", |'[ -!#-~]*', |\d+.\d+, |\d+, |true, |false, |"[ -!#-~]*"|'[ -!#-~]*'|\d+.\d+|\d+|false|true)*(\u005d)|"[ -!#-~]*"|'[ -!#-~]*'|\d+.\d+|\d+|false|true/g;
    return args.match(reg);
};


const funcArr = [blockHandler,varDeclHandler, assignmentHandler, ifHandler, returnHandler, bcHandler, bcHandler, whileHandler];

const subCode = (codeToSub, argsInput) => {
    init();
    codeAfterSub = codeToSub.split('\n');
    let args = eval('['.concat(argsInput,']'));
    let parsedCode = esprima.parseScript(codeToSub, {loc: true});
    let map =getGlobalsAndFunc(parsedCode);
    buildDictionary(map.globals);
    params = assignParams(map.func.params, args);
    traverseFunc(map.func.body);
    let colors = expandArr();
    return {code:codeAfterSub,color:colors};
};

const init = ()=>{
    locals = [];
    params = [];
    globals=[];
    lineNums=[];
    codeAfterSub = [];
    inIf = false;
    first=true;
};
const expandArr=()=>{
    let ret = [];
    let j=0;
    for(let x =0; x<codeAfterSub.length;x++ ){
        if(j<lineNums.length){
            if(lineNums[j].line===x+1){
                ret.push(lineNums[j].color);
                j=j+1;
            }
            else {ret.push('white');}
        }
        else {ret.push('white');}

    }
    return ret;
};

const traverseFunc = (func)=>{
    let index = typeArr.indexOf(func.type);
    funcArr[index](func);
};



const assignParams = (params, args) =>{
    let paramBinding = [];
    for(let x in params){
        paramBinding.push({id: params[x].name, value:[stringifier((args[x]),'[')]});
    }
    return paramBinding;
};

const stringifier = (element, str)=>{
    if(element.constructor === Array){
        let i=0;
        for(i = 0; i < element.length-1; i++){
            str=str.concat(stringifier(element[i]),', ');
        }
        str=str.concat(stringifier(element[i],'['),']');
        return str;
    }
    return element.toString();
};

const buildDictionary = (input)=>{
    for(let x=0;x<input.length; x++){
        if (input[x].type==='VariableDeclaration'){
            for(let y in input[x].declarations){
                globals.push({id:input[x].declarations[y].id.name, value:[escodegen.generate(input[x].declarations[y].init)]});
            }}
        else assignmentHandler(input[x]);
    }
};

const getGlobalsAndFunc = (ast)=>{
    let body  = ast.body;
    let ret = {func:null, globals:[]};
    for(let x in body){
        if(body[x].type==='FunctionDeclaration'){ret.func=body[x];break;}
        else ret.globals.push(body[x]);
    }
    return ret;
};



export {subCode};
