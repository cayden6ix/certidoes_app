module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allow sentence case in commit subjects (e.g., "Atualizado as diretrizes do husky").
    "subject-case": [0],
  },
};
