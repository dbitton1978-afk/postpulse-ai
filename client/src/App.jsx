async function persistHistory(type, input, data) {
  try {
    const response = await savePost({
      type,
      language,
      input,
      data
    });

    if (response?.post) {
      setHistory((prev) => [response.post, ...prev].slice(0, 100));
      setCopyMessage(t.saved);
      return;
    }

    setError("History save failed");
  } catch (err) {
    setError(err?.message || "History save failed");
  }
}
