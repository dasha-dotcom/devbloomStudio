export function HeroPreview() {
  return (
    <div className="hero-preview glass-card">
      <div className="preview-browser">
        <div className="preview-toolbar">
          <div className="preview-dots">
            <span />
            <span />
            <span />
          </div>
          <span className="preview-badge">Live coding studio</span>
        </div>
        <div className="preview-pane-grid">
          <div className="mini-editor">
            <div className="mini-editor-header">
              <span>all-about-me.html</span>
              <span>Guided step: Add your title</span>
            </div>
            <div className="code-lines">
              <div className="code-line">
                <span>1</span>
                <div>
                  <span className="token-tag">&lt;h1&gt;</span>
                  <span className="token-value">Hi, I&apos;m Maya!</span>
                  <span className="token-tag">&lt;/h1&gt;</span>
                </div>
              </div>
              <div className="code-line">
                <span>2</span>
                <div>
                  <span className="token-tag">&lt;p&gt;</span>I love sketching, soccer,
                  and building mini websites.<span className="token-tag">&lt;/p&gt;</span>
                </div>
              </div>
              <div className="code-line">
                <span>3</span>
                <div>
                  <span className="token-tag">&lt;ul&gt;</span>
                </div>
              </div>
              <div className="code-line">
                <span>4</span>
                <div>
                  &nbsp;&nbsp;<span className="token-tag">&lt;li&gt;</span>Bubble tea
                  <span className="token-tag">&lt;/li&gt;</span>
                </div>
              </div>
              <div className="code-line">
                <span>5</span>
                <div>
                  &nbsp;&nbsp;<span className="token-tag">&lt;li&gt;</span>Space facts
                  <span className="token-tag">&lt;/li&gt;</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mini-site">
            <div className="mini-site-header">
              <span>Live preview</span>
              <span>Theme: Ocean</span>
            </div>
            <div className="mini-site-body">
              <span className="mini-badge">All About Me</span>
              <h3>Hi, I&apos;m Maya!</h3>
              <p>I love sketching, soccer, and building mini websites.</p>
              <ul>
                <li>Bubble tea</li>
                <li>Space facts</li>
                <li>Cozy blue colors</li>
              </ul>
              <div className="mini-avatar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
