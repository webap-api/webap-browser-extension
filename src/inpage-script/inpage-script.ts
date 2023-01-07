import WebAP from './webap';

console.log('WebAP: Inpage Script injected');

(window as any).WebAP = new WebAP();