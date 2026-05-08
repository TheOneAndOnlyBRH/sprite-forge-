# 🛠️ Sprite Forge: Neural Asset Pipeline

**Sprite Forge** is a specialized utility designed for game developers to bridge the gap between natural language prompts and production-ready animation assets. By implementing a **Character DNA Anchoring System**, it ensures visual consistency (clothing, features, and color palettes) across multiple perspectives—solving the common AI "morphing" problem in sprite generation.

---

## 🚀 Key Features
- **Identity Anchoring:** Maintains character 'DNA' across various poses to ensure assets are game-ready.
- **Pose Checklist:** One-click generation for **Front, Side, Back, and Attack** views.
- **Secure API Management:** User-provided API keys (Stability AI / OpenAI) are stored locally in the browser, never touching the server.
- **Modern Architecture:** Built with a high-performance stack for real-time asset iteration.

## 🛠️ Tech Stack
- **Frontend:** React 18 + TypeScript
- **Routing:** TanStack Router (Standard for high-scale React apps)
- **Styling:** Tailwind CSS + Radix UI (Shadcn/UI components)
- **Icons:** Lucide React
- **Build Tool:** Vite
---

## 🧠 The AI Strategy
Standard AI image generation is stochastic and often loses character detail between prompts. Sprite Forge wraps user input in a "Consistency Anchor"—a set of hidden global prompts and negative constraints that force the diffusion model to prioritize the character's unique traits before applying positional logic. This creates a cohesive "Sprite Sheet" effect suitable for 2D animation.

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Stability AI API Key (Optional: The app includes a demo mode with placeholders)

### Installation
1. **Clone the repository:**
   ```bash
   [https://github.com/TheOneAndOnlyBRH/sprite-forge-](https://github.com/TheOneAndOnlyBRH/sprite-forge-)



### Install dependencies:
```
npm install

```
### Start the development server:

```
npm run dev

```
---

