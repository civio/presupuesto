import npm from "rollup-plugin-node-resolve";

const onwarn = warning => {
  // Silence circular dependency warning for d3
  if (warning.code === 'CIRCULAR_DEPENDENCY' && !warning.importer.indexOf('node_modules/d3')) {
    return
  }

  console.warn(`\x1b[33m\x1b[1m(!) ${warning.message}\x1b[0m`)
}

export default {
  input: "rollup-entry.js",
  plugins: [ npm({ jsnext: true} ) ],
  onwarn,
  output: {
    format: "umd",
    name: "d3",
    file: "budget_app/static/javascripts/vis/d3-bundle.js"
  }
};
