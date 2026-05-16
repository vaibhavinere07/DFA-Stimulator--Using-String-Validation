# DFA Simulator | String Validation

A modern, interactive, and educational web application designed to help users master **Deterministic Finite Automata (DFA)** through real-time visualization and string validation.

![DFA Simulator Hero](https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=1000)

## ✨ Features

- **Interactive DFA Creation**: Easily define your alphabet, states, and transition functions through an intuitive UI.
- **Real-time Visualization**: Watch how the automaton moves between states as it processes your input strings symbol by symbol.
- **User Authentication**: Secure your work! Create an account to save your custom DFA configurations and access them from any session.
- **DFA Library (My Saved DFAs)**: A dedicated gallery where you can browse, reload, or delete your saved simulations.
- **Smart Templates**: Quick-start with pre-built templates like "Even number of 0s", "Ends with 1", or "Binary divisible by 3".
- **Step-by-Step Processing**: Detailed logs show every state transition during simulation, making it a perfect educational tool.
- **Premium Aesthetics**: A stunning dark-mode interface featuring glassmorphism, fluid animations, and a responsive design.

## 🛠️ Technology Stack

- **Core**: HTML5, Vanilla JavaScript (ES6 Modules)
- **Styling**: Vanilla CSS3 with Modern CSS Variables
- **Persistence**: `localStorage` based user session and data management
- **Visualization**: Dynamic Canvas-based rendering

## 🚀 Getting Started

To run the DFA Simulator locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vaibhavinere07/DFA-Stimulator--Using-String-Validation.git
   ```
2. **Open the project**:
   Open `index.html` in your favorite web browser. 
   *Recommended: Use a local development server like "Live Server" in VS Code for the best experience with ES Modules.*

3. **How to use**:
   - **Sign In/Up**: Click the Sign In button to create an account. This is required to access the simulator.
   - **Start Simulation**: Once logged in, click "Start Simulation" to enter the configuration area.
   - **Configure**: Enter your alphabet and select final states. Fill out the transition table.
   - **Run**: Enter a test string and watch the magic happen!

## 📂 Project Structure

```text
├── index.html          # Main entry point & UI structure
├── styles/
│   └── main.css        # Premium design system & styles
└── js/
    ├── app.js          # Main application logic & event handling
    ├── auth_manager.js # User session & registration logic
    ├── dfa_core.js     # Core DFA mathematical logic
    ├── storage_manager.js # Data persistence & templates
    └── ui_manager.js   # UI rendering & state management
```

## 🎓 Educational Value

This tool is built to simplify the learning curve for Computer Science students studying **Automata Theory**. It provides a bridge between theoretical mathematical definitions and practical, visual understanding.

---
Built with ❤️ for Educational Excellence.
