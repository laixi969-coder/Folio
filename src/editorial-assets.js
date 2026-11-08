// Keep candidate covers and generated-but-not-inserted images portable too.
export async function mapEditorialAssets(article, mapper) {
  return {...article,
    ...(article.entryCandidates?{entryCandidates:await Promise.all(article.entryCandidates.map(async candidate=>({...candidate,cover:candidate.cover?await mapper(candidate.cover):null})))}:{}),
    ...(article.imageTasks?{imageTasks:await Promise.all(article.imageTasks.map(async task=>({...task,...(task.generatedAsset?{generatedAsset:await mapper(task.generatedAsset)}:{})})))}:{})
  };
}
