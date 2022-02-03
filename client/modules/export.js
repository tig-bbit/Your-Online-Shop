import {getSiteText} from './sitecontent.js';
import {Node, NodeMale, NodeFemale} from './nodesfront.js';
import {packing, unpacking, detectGender} from './../../shared/modules/utils.js';
import {languages} from './languages.js';

const exportFunc = new Map();

// To export data with lang content we first export the lang tree for first 2 levels: root and its rels (languages key). Then the root element tree to be exported with all langs.

exportFunc.set("menus", async ()=>{  
  const {getPageText} = await import('./pagescontent.js')
  const pagesText=await getPageText();
  const textClone=pagesText.cloneNode(null, 0);
  await textClone.loadRequest("get my tree");
  const myRel=textClone.getRelationship("pageelements");
  return {"languages": await Node.requestMulti("add my tree", languages.children, null, true), "tree": await myRel.request("add my tree", null, true)};
});

exportFunc.set("catalog", async ()=>{
  const {getCategoriesRoot} = await import('./pagescontent.js');
  const catRoot = await getCategoriesRoot().cloneNode(null, 0).loadRequest("get my tree");
  //data from the structure
  return {"languages": await Node.requestMulti("add my tree", languages.children, null, true), "tree": await catRoot.request("add my tree", null, true)};
});

exportFunc.set("checkout", async ()=>{
  const shippingtypesmother=await new NodeFemale("TABLE_SHIPPINGTYPES").loadRequest("get my tree");
  const paymenttypesmother=await new NodeFemale("TABLE_PAYMENTTYPES").loadRequest("get my tree");
  return {"languages": await Node.requestMulti("add my tree", languages.children, null, true), "tree": [await shippingtypesmother.request("add my tree", null, true), await paymenttypesmother.request("add my tree", null, true)]};
});

exportFunc.set("lang", async (langdata)=>{
  //data from the structure
  const myNodes=await Node.requestMulti( "get my tree", Array(langdata.children.length).fill(getSiteText().cloneNode(null, 0)), langdata.children.map(result => new Object({extraParents: result.getRelationship("siteelementsdata")})));
  const nodesInsert=[];
  for (let i=0; i<myNodes.length; i++) {
    // Request result is an array of arrays with the relationships. myNodes[0] => siteelements
    let loadNode=getSiteText().cloneNode(0, 0);
    loadNode.load(unpacking(myNodes[i]));
    //Now we remove titles custom elements
    loadNode.getRelationship().removeChild(loadNode.getNextChild("page_head_title"));
    loadNode.getRelationship().removeChild(loadNode.getNextChild("page_head_subtitle"));
    nodesInsert.push(await loadNode.request("add my tree", null, true));
  }
  return {"languages": await Node.requestMulti("add my tree", langdata.children, null, true), "trees": nodesInsert};
});

exportFunc.set("users", async ()=>{
  const usertypemother=await new NodeFemale("TABLE_USERSTYPES").loadRequest("get all my children", {filterProps: {type: "customer"}});
  const usertype=await usertypemother.getChild().loadRequest("get my tree", {deepLevel: 3});
  const users= usertype.getRelationship("users").children;
  const mydatanodes=[];
  for (let i=0; i<users.length; i++) {
    mydatanodes.push(users[i].getRelationship("usersdata"));
    mydatanodes.push(users[i].getRelationship("addresses"));
  }
  //I think we are using multi because is mor straight forward thant doing itchild by child
  const resultData=await Node.requestMulti("get my children", mydatanodes);
  const arrayusersdata=[];
  const arrayaddresses=[];
  
  for (let i=0; i<resultData.length; i++) {
    if (i % 2) { //impar
      arrayaddresses.push(resultData[i].data);
    }
    else {
      arrayusersdata.push(resultData[i].data);
    }
  }
  for (let i=0; i<users.length; i++) {
    users[i].getRelationship("usersdata").load(arrayusersdata[i]);
    users[i].getRelationship("addresses").load(arrayaddresses[i]);
  }
  return packing(usertype.getRelationship("users"));
});

exportFunc.set("db", async ()=>{
  const db=[];
  db.push(await new NodeFemale("TABLE_USERSTYPES").loadRequest("get my tree"));
  const {getPageText} = await import('./pagescontent.js')
  db.push(await getPageText().cloneNode(null, 0).loadRequest("get my tree"));
  const {getSiteText} = await import('./sitecontent.js')
  db.push(await getSiteText().cloneNode(null, 0).loadRequest("get my tree"));
  const {getCategoriesRoot} = await import('./categories.js');
  db.push(await getCategoriesRoot().cloneNode(null, 0).loadRequest("get my tree"));
  db.push(await new NodeFemale("TABLE_SHIPPINGTYPES").loadRequest("get my tree"));
  db.push(await new NodeFemale("TABLE_PAYMENTTYPES").loadRequest("get my tree"));
  
  return {"languages": await Node.requestMulti("add my tree", languages.children, null, true), "tree": await Node.requestMulti("add my tree", db, null, true)};
});

export {exportFunc};