
export const objectToFormData = <T extends Record<string, any>>(data: T) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === "number" && isNaN(value)) return;
    if (value === "") return;

    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, String(item)));
    } else if (key === "imageUrl") {
      // Skip non-File values for imageUrl — backend expects MultipartFile
      return;
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
};
