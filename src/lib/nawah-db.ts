import { Octokit } from 'octokit';

const octokit = new Octokit({
  auth: 'ghp_ضع_التوكن_الخاص_بك_هنا' 
});

const REPO_OWNER = 'zraq301-lgtm';
const REPO_NAME = 'Nawah-AI-db';
const TENANT_ID = 'nawah-core'; // المعرف الذي اخترناه للمنظمة

export const sendToDatabase = async (collection: string, data: any) => {
  try {
    const fileName = `${Date.now()}.json`;
    const path = `database/${TENANT_ID}/${collection}/${fileName}`;
    
    // تحويل البيانات لنظام Base64 المطلوب في جيت هب
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: path,
      message: `New entry in ${collection} from Maamoul App`,
      content: content
    });

    return { success: true };
  } catch (error) {
    console.error("خطأ في الاتصال بقاعدة البيانات:", error);
    return { success: false, error };
  }
};
