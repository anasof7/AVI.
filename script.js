/*
 * The existing README.md contains the p5.js sketch. Load it as a classic
 * script so the original global-mode callbacks and interactions remain intact.
 * GitHub Pages serves this relative URL from the repository root, including
 * when the repository is published as a project site under /<repository>/.
 */
(async function startExperience() {
  const errorBox = document.getElementById("load-error");
  try {
    if (typeof window.p5 !== "function") {
      throw new Error("No se pudo cargar p5.js. Comprueba tu conexión e inténtalo de nuevo.");
    }

    const response = await fetch(new URL("./README.md", document.baseURI));
    if (!response.ok) {
      throw new Error(`No se pudo cargar el código de la experiencia (HTTP ${response.status}).`);
    }

    // Las imágenes y los 46 cuadros de AVI están en PNG. Normaliza referencias
    // antiguas a JPG del README sin alterar el contenido ni el diseño del sketch.
    const source = (await response.text()).replace(/\.jpg(?=["'])/gi, ".png");
    const sketch = document.createElement("script");
    sketch.textContent = source;
    document.body.appendChild(sketch);
  } catch (error) {
    console.error("No se pudo iniciar AVI A.M:", error);
    errorBox.textContent = `${error.message} Revisa que README.md esté en la raíz del repositorio y vuelve a publicar GitHub Pages.`;
    errorBox.hidden = false;
  }
})();
