function moveImproveResultToAnalyze() {
  const improveData =
    result && result.type === "improve" ? result.data : null;

  const improvedPost =
    getPrimaryImproveText(improveData) ||
    improveForm.post ||
    currentPost ||
    "";

  if (!improvedPost.trim()) {
    setError(t.errorPost);
    return;
  }

  setCurrentPost(improvedPost);

  setAnalyzeForm((prev) => ({
    ...prev,
    post: improvedPost,
    platform: improveForm.platform || prev.platform || "instagram"
  }));

  setError("");
  setTab("analyze");
}

function moveAnalyzeImprovedToImprove(goalValue = "") {
  const analyzeData =
    result && result.type === "analyze" ? result.data : analysisResult;

  const strongestWeakArea = getWeakestArea(analyzeData, t);

  const improvedVersion =
    getPrimaryAnalyzeText(analyzeData) ||
    analyzeForm.post ||
    currentPost ||
    "";

  if (!improvedVersion.trim()) {
    setError(t.errorPost);
    return;
  }

  const smartGoal =
    goalValue ||
    strongestWeakArea?.goal ||
    t.goalPresetMoreHuman ||
    (isHebrew
      ? "שפר את הפוסט לפי הניתוח כדי להעלות ביצועים"
      : "Improve the post based on analysis to increase performance");

  setCurrentPost(improvedVersion);

  setImproveForm((prev) => ({
    ...prev,
    post: improvedVersion,
    goal: smartGoal,
    platform: analyzeForm.platform || prev.platform || "instagram"
  }));

  setError("");
  setTab("improve");
}

function loadHistoryItem(item) {
  if (!item) return;

  setResult({
    type: item.type,
    data: item.data
  });

  if (item.type === "build") {
    const loadedPost = buildPostFromBuildResult(item.data);

    setCurrentPost(loadedPost);

    setImproveForm((prev) => ({
      ...prev,
      post: loadedPost || prev.post,
      goal: t.goalPresetMoreHuman,
      style: buildForm.style,
      platform: buildForm.platform
    }));

    setAnalyzeForm((prev) => ({
      ...prev,
      post: loadedPost || prev.post,
      platform: buildForm.platform
    }));

    setTab("build");
  }

  if (item.type === "improve") {
    const improvedText = getPrimaryImproveText(item.data);

    setCurrentPost(improvedText);

    setImproveForm((prev) => ({
      ...prev,
      post: improvedText || prev.post
    }));

    setAnalyzeForm((prev) => ({
      ...prev,
      post: improvedText || prev.post,
      platform: improveForm.platform || prev.platform
    }));

    setTab("improve");
  }

  if (item.type === "analyze") {
    const loadedAnalysis = item.data || null;
    const analyzedText =
      getPrimaryAnalyzeText(loadedAnalysis) ||
      analyzeForm.post ||
      currentPost ||
      "";
    const loadedWeakestArea = getWeakestArea(loadedAnalysis, t);

    setAnalysisResult(loadedAnalysis);
    setCurrentPost(analyzedText);

    setAnalyzeForm((prev) => ({
      ...prev,
      post: analyzedText || prev.post
    }));

    setImproveForm((prev) => ({
      ...prev,
      post: analyzedText || prev.post,
      goal: loadedWeakestArea?.goal || prev.goal || t.goalPresetMoreHuman,
      platform: analyzeForm.platform || prev.platform || "instagram"
    }));

    setTab("analyze");
  }

  setError("");
}
