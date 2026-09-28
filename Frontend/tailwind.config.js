// // /** @type {import('tailwindcss').Config} */
// // export default {
// //     content: ["./index.html", "./src/**/*.{js,jsx}"],
// //     theme: {
// //       extend: {
// //         colors: {
// //           brand: {
// //             50: "#eef8ff",
// //             100: "#d9efff",
// //             200: "#bce2ff",
// //             300: "#8fd1ff",
// //             400: "#5ab7ff",
// //             500: "#2d99ff",
// //             600: "#157af5",
// //             700: "#1060e0",
// //             800: "#124db5",
// //             900: "#15438e"
// //           }
// //         },
// //         boxShadow: {
// //           soft: "0 10px 30px rgba(2, 32, 71, 0.08)"
// //         }
// //       }
// //     },
// //     plugins: [require("@tailwindcss/forms")]
// //   };

// import forms from "@tailwindcss/forms";

// export default {
//   content: ["./index.html", "./src/**/*.{js,jsx}"],
//   theme: {
//     extend: {
//       colors: {
//         brand: {
//           50: "#eef8ff",
//           100: "#d9efff",
//           200: "#bce2ff",
//           300: "#8fd1ff",
//           400: "#5ab7ff",
//           500: "#2d99ff",
//           600: "#157af5",
//           700: "#1060e0",
//           800: "#124db5",
//           900: "#15438e"
//         }
//       }
//     }
//   },
//   plugins: [forms]
// };

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
      extend: {
        colors: {
          brand: {
            50: "#eef8ff",
            100: "#d9efff",
            200: "#bce2ff",
            300: "#8fd1ff",
            400: "#5ab7ff",
            500: "#2d99ff",
            600: "#157af5",
            700: "#1060e0",
            800: "#124db5",
            900: "#15438e"
          }
        },
        boxShadow: {
          soft: "0 10px 30px rgba(2, 32, 71, 0.08)"
        }
      }
    },
    plugins: []
  };