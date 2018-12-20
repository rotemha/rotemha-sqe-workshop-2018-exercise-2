import $ from 'jquery';
import {subCode} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToSub = $('#codePlaceholder').val();
        let args = $('#argsPlaceholder').val();
        let sub = subCode(codeToSub,args);
        $('#parsedCode').html(backgroundPaint(sub.code,sub.color));
    });
});
const backgroundPaint=(code, colors)=>{
    let ret ='';
    for(let x in code){
        if(code[x]!=='\n'){
            if(colors[x]==='green'){
                ret = ret + '<p>' + '<PaintInGreen>' + ((code[x]).replace('>',' > ').replace('<',' < ')) + '</PaintInGreen>' + '</p>';
            }
            else if(colors[x]==='red'){
                ret = ret + '<p>' + '<PaintInRed>' + ((code[x]).replace('>',' > ').replace('<',' < ')) + '</PaintInRed>' + '</p>';
            }
            else {ret = ret + ((code[x]).replace('>',' > ').replace('<',' < '))+'</br\n>';}
        }
    }
    return ret;
};

