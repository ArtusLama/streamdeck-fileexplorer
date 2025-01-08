# Stream Deck File Explorer Plugin

### Description

Enhance your Stream Deck with the **File Explorer Plugin**, a powerful and easy to use tool to view, navigate, and manage your files and folders directly from the Stream Deck. With seamless folder navigation, quick file previews, and pagination features, managing your files has never been easier.

### Features

- **View Folder Content**: Display all files and folders in the current directory directly on your Stream Deck.
- **Folder Navigation**:
    - Open subfolders by clicking on them.
    - Navigate to the parent folder with a single click.
- **Pagination**: Browse large folders effortlessly with paginated views and intuitive navigation keys.
- **File Interaction**:
    - Open files using their default associated programs.
    - Images appear as thumbnails directly on the Stream Deck keys.
- **Page Info Key**:
    - Shows the current page and total pages.
    - Configurable click settings:
        - Do nothing.
        - Open the folder in File Explorer.
        - Jump to the first page.
        - **More options coming soon!**
- **Customizable Layout**: Move and arrange folder content and navigation buttons to suit your workflow.

---

### For Developers

#### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/stream-deck-file-explorer.git
    ```
2. Navigate to the project directory:
    ```bash
    cd stream-deck-file-explorer
    ```
3. Follow the building instructions below to deploy the plugin to your Stream Deck.

#### Running

0. **If you don't have already:**
    ```bash
    npm install -g @elgato/cli
    ```
1. Install dependencies:
    ```bash
    npm install
    ```
2. Linking the plugin:
    ```bash
    streamdeck link de.artus.fileexplorer
    ```
3. Running the plugin:
    ```bash
    npm run watch
    ```
4. Now you should see the plugin inside your Stream Deck application.

#### Development Notes

- If you have any problems, refer to the Stream Deck [Plugin Documentation](https://docs.elgato.com/streamdeck/sdk/introduction/getting-started) or contact me.

---

### Roadmap / ToDos

- Create profiles for other devices (Pro, XL)
- Click Action:
    - Single -> opens file/folder;
    - Long Press -> opens file/folder manage screen/profile (e.g. deleting, show in explorer, ...)
- Better pagination performance
- Test on other devices (mac and linux)
- Github Actions workflow for linting
- Translations (i18n)
- Change PNGs to SVGs

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
