import { ResearchPaper } from '../types';

/**
 * Standard Research Domains for ResearchIntel AI Platform
 */
export const STANDARD_RESEARCH_DOMAINS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Natural Language Processing',
  'Computer Vision',
  'Data Science',
  'Cybersecurity',
  'Healthcare AI',
  'Distributed Computing',
  'Other / Uncertain'
] as const;

/**
 * High-fidelity benchmark academic research corpus across the 10 target domains (2019-2026).
 * All papers include structured abstracts, authors, DOIs, and publication years.
 */
export const SYNTHETIC_RESEARCH_PAPERS: ResearchPaper[] = [
  // --- Natural Language Processing ---
  {
    id: 'syn-nlp-001',
    title: 'Transformer Architecture Refinements for Low-Resource Cross-Lingual Semantic Transfer',
    abstract: 'Pre-trained language models exhibit remarkable cross-lingual transfer capabilities when pre-trained on high-resource corpora. However, linguistic divergence and tokenization misalignment hinder performance in underrepresented vernaculars. In this work, we propose a modular subword alignment mechanism combined with sparse vocabulary projection to mitigate representation drift across distant language families. Empirical evaluations on multi-lingual benchmarks indicate a 4.2 percent gain in semantic parsing accuracy without parameter inflation.',
    publication_year: 2021,
    category: 'Natural Language Processing',
    keywords: ['cross-lingual', 'transformers', 'subword alignment', 'semantic parsing'],
    authors: ['A. R. Thorne', 'M. Chen', 'P. K. Sundaram'],
    doi: '10.1145/3442381.3449811',
    source_url: 'https://doi.org/10.1145/3442381.3449811',
    source_type: 'dataset'
  },
  {
    id: 'syn-nlp-002',
    title: 'Mitigating Hallucinatory Drift in Instruction-Tuned Autoregressive Language Models',
    abstract: 'Autoregressive language models frequently generate confident yet factually incorrect assertions when prompted beyond their parametric training horizon. We introduce contrastive decoding with entropy-regularized uncertainty estimation to penalize spurious token distributions during generation. Across multi-hop reasoning tasks, our approach suppresses unsupported factual claims by 34 percent while maintaining syntactic fluidity and semantic coherence.',
    publication_year: 2023,
    category: 'Natural Language Processing',
    keywords: ['hallucination mitigation', 'instruction tuning', 'contrastive decoding', 'factual accuracy'],
    authors: ['E. Zhang', 'D. Vance', 'S. Takahashi'],
    doi: '10.18653/v1/2023.acl-long.412',
    source_url: 'https://doi.org/10.18653/v1/2023.acl-long.412',
    source_type: 'dataset'
  },
  {
    id: 'syn-nlp-003',
    title: 'Linearized Attention Mechanisms for Long-Document Context Modeling in Scientific Retrieval',
    abstract: 'Quadratic computational complexity poses a fundamental barrier when processing long scientific articles. We formulate a kernelized linear attention framework that approximates full attention using random Fourier feature mappings with decay biasing. On long-context academic summarization and citation retrieval tasks, our model achieves comparable ROUGE scores at a 4.8x reduction in peak GPU memory allocation.',
    publication_year: 2022,
    category: 'Natural Language Processing',
    keywords: ['linear attention', 'long-context modeling', 'scientific summarization', 'efficiency'],
    authors: ['R. Gupta', 'L. Dubois', 'K. Al-Mansoor'],
    doi: '10.1609/aaai.v36i9.21200',
    source_url: 'https://doi.org/10.1609/aaai.v36i9.21200',
    source_type: 'dataset'
  },
  {
    id: 'syn-nlp-004',
    title: 'Reasoning Calibration in Chain-of-Thought Prompting via Iterative Self-Critique',
    abstract: 'Step-by-step reasoning prompts enable complex logical deduction in neural language models, yet error propagation across reasoning steps degrades final outputs. We propose a recursive self-critique loop that isolates weak premise links and rewrites intermediate propositions. Tests across symbolic arithmetic and commonsense reasoning benchmarks show notable error reduction.',
    publication_year: 2025,
    category: 'Natural Language Processing',
    keywords: ['chain-of-thought', 'reasoning calibration', 'self-critique', 'symbolic deduction'],
    authors: ['L. Zhao', 'E. Falk', 'A. K. Menon'],
    doi: '10.48550/arXiv.2501.04891',
    source_url: 'https://arxiv.org/abs/2501.04891',
    source_type: 'dataset'
  },

  // --- Computer Vision ---
  {
    id: 'syn-cv-001',
    title: 'Spatially-Aware Vision Transformers for Dense Panoptic Segmentation in Autonomous Driving',
    abstract: 'Dense pixel-level scene parsing requires reconciling high-resolution localized spatial features with broad global contextual cues. We propose a dual-branch vision transformer incorporating dynamic relative positional encodings and scale-selective token downsampling. Validated on cityscapes benchmarks, our framework achieves real-time inference at 38 frames per second while improving mean Intersection over Union.',
    publication_year: 2022,
    category: 'Computer Vision',
    keywords: ['vision transformers', 'panoptic segmentation', 'autonomous driving', 'spatial awareness'],
    authors: ['K. Weber', 'J. H. Kim', 'L. Morata'],
    doi: '10.1109/CVPR52688.2022.00192',
    source_url: 'https://doi.org/10.1109/CVPR52688.2022.00192',
    source_type: 'dataset'
  },
  {
    id: 'syn-cv-002',
    title: 'Self-Supervised Monocular Depth Estimation with Geometric Consistency Regularization',
    abstract: 'Training monocular depth networks without ground-truth lidar supervision often yields blurred object boundaries and scale ambiguity. We introduce an epipolar geometry loss combined with temporal photometric bundle adjustment over sequential video frames. Extensive experiments show reduced absolute relative error in outdoor automotive benchmarks.',
    publication_year: 2021,
    category: 'Computer Vision',
    keywords: ['monocular depth', 'self-supervised learning', 'epipolar geometry', 'photometric consistency'],
    authors: ['F. Alvarez', 'T. Henderson', 'C. Liang'],
    doi: '10.1109/ICCV48922.2021.00843',
    source_url: 'https://doi.org/10.1109/ICCV48922.2021.00843',
    source_type: 'dataset'
  },
  {
    id: 'syn-cv-003',
    title: 'Zero-Shot 3D Gaussian Splatting from Sparse Multi-View Photogrammetry',
    abstract: 'Real-time novel view synthesis has made drastic advances through explicit 3D Gaussian radiance representations. However, sparse camera views frequently lead to floating artifacts and geometric collapse. We introduce structural depth prior conditioning and normal consistency regularization to anchor Gaussian centroids, enabling photorealistic rendering with as few as three input perspectives.',
    publication_year: 2024,
    category: 'Computer Vision',
    keywords: ['3D gaussian splatting', 'novel view synthesis', 'photogrammetry', 'sparse views'],
    authors: ['S. M. Laurent', 'A. Novak', 'Y. Wang'],
    doi: '10.1145/3641519.3657410',
    source_url: 'https://doi.org/10.1145/3641519.3657410',
    source_type: 'dataset'
  },
  {
    id: 'syn-cv-004',
    title: 'Event-Camera Feature Tracking Under Extreme Low-Light and High-Speed Motion',
    abstract: 'Traditional frame-based cameras fail under severe motion blur and high dynamic range lighting conditions. Neuromorphic event cameras offer microsecond temporal resolution but produce asynchronous spatio-temporal event streams. We present an asynchronous graph convolution network that reconstructs continuous optical trajectories with sub-pixel precision.',
    publication_year: 2023,
    category: 'Computer Vision',
    keywords: ['event cameras', 'neuromorphic vision', 'motion tracking', 'high dynamic range'],
    authors: ['M. Vogt', 'D. K. Prasad', 'C. Lefevre'],
    doi: '10.1109/TPAMI.2023.3289012',
    source_url: 'https://doi.org/10.1109/TPAMI.2023.3289012',
    source_type: 'dataset'
  },

  // --- Healthcare AI ---
  {
    id: 'syn-health-001',
    title: 'Multi-Modal Deep Learning for Early Sepsis Prediction in Intensive Care Units',
    abstract: 'Sepsis remains a primary cause of mortality in critical care units, where early physiological deterioration is subtle. We present a multi-modal temporal neural network that unifies asynchronous vital sign time series, high-frequency lab measurements, and clinician clinical notes. Validated on retrospective ICU cohorts, the system alerts clinical teams up to six hours prior to standard clinical onset with high specificity.',
    publication_year: 2020,
    category: 'Healthcare AI',
    keywords: ['sepsis prediction', 'ICU monitoring', 'time-series neural networks', 'clinical decision support'],
    authors: ['Dr. C. Reynolds', 'M. F. Al-Hassan', 'J. G. Wu'],
    doi: '10.1038/s41746-020-00318-7',
    source_url: 'https://doi.org/10.1038/s41746-020-00318-7',
    source_type: 'dataset'
  },
  {
    id: 'syn-health-002',
    title: 'Federated Contrastive Learning for Multi-Institutional Histopathology Whole-Slide Classification',
    abstract: 'Digital pathology image classification is challenged by stringent patient privacy regulations preventing cross-hospital data centralization. We deploy federated self-supervised contrastive learning with adaptive client gradient weighting to harmonize diverse stain variations. Across three independent hospital networks, the federated model achieved diagnostic concordance equivalent to centralized pooling.',
    publication_year: 2022,
    category: 'Healthcare AI',
    keywords: ['federated learning', 'histopathology', 'privacy preserving', 'whole slide imaging'],
    authors: ['E. K. Lindqvist', 'P. K. Verma', 'S. O\'Donnell'],
    doi: '10.1016/j.media.2022.102551',
    source_url: 'https://doi.org/10.1016/j.media.2022.102551',
    source_type: 'dataset'
  },
  {
    id: 'syn-health-003',
    title: 'Protein-Ligand Binding Affinity Prediction via Geometric Equivariant Graph Representations',
    abstract: 'Rational computational drug design relies on accurate estimation of free energy binding between small molecules and target proteins. We propose SE(3)-equivariant graph neural networks that naturally preserve 3D rotational and translational symmetries of molecular coordinate complexes. On benchmark affinity datasets, our model achieves lower root mean squared error than standard molecular docking simulations.',
    publication_year: 2023,
    category: 'Healthcare AI',
    keywords: ['binding affinity', 'drug discovery', 'equivariant graph networks', 'molecular modeling'],
    authors: ['V. Ramachandran', 'A. De Smet', 'G. Thorne'],
    doi: '10.1021/acs.jcim.3c00421',
    source_url: 'https://doi.org/10.1021/acs.jcim.3c00421',
    source_type: 'dataset'
  },
  {
    id: 'syn-health-004',
    title: 'Explainable AI for Radiographic Pneumothorax Detection Using Grad-CAM and Counterfactuals',
    abstract: 'Black-box neural network decisions in medical imaging raise justified safety concerns among clinical radiologists. We combine attention-driven activation maps with localized counterfactual image perturbations to highlight anatomical discriminants in chest radiography. In blinded physician reader studies, our interpretability module boosted diagnostic confidence and reduced diagnostic review latency.',
    publication_year: 2021,
    category: 'Healthcare AI',
    keywords: ['explainable AI', 'radiology', 'pneumothorax', 'counterfactual explanations'],
    authors: ['H. S. Bauer', 'K. I. Patel', 'M. N. Rossi'],
    doi: '10.1148/ryai.2021200199',
    source_url: 'https://doi.org/10.1148/ryai.2021200199',
    source_type: 'dataset'
  },

  // --- Cybersecurity ---
  {
    id: 'syn-sec-001',
    title: 'Graph Neural Networks for Polymorphic Malware Detection via Control Flow Graph Embeddings',
    abstract: 'Modern malware authors employ code obfuscation, dead-code insertion, and instruction substitution to evade signature-based detection mechanisms. We model disassembled binary functions as attributed control-flow graphs and learn structural embeddings using relational graph attention networks. Evaluated against 45,000 recent polymorphic samples, our framework achieves detection rates over 98.7% with minimal false positives.',
    publication_year: 2021,
    category: 'Cybersecurity',
    keywords: ['polymorphic malware', 'control flow graphs', 'graph neural networks', 'binary analysis'],
    authors: ['R. V. Mercer', 'K. S. Zhao', 'T. H. Larsson'],
    doi: '10.1109/SP40001.2021.00034',
    source_url: 'https://doi.org/10.1109/SP40001.2021.00034',
    source_type: 'dataset'
  },
  {
    id: 'syn-sec-002',
    title: 'Adversarial Robustness of Network Intrusion Classifiers via Provable Randomized Smoothing',
    abstract: 'Machine learning models deployed for network anomaly detection are vulnerable to evasion attacks through crafted packet inter-arrival jitter and payload padding. We apply randomized smoothing over discrete network feature spaces to establish certifiable robustness guarantees. We demonstrate theoretical and empirical bounds on defense efficacy against state-of-the-art evasive packet manipulation.',
    publication_year: 2022,
    category: 'Cybersecurity',
    keywords: ['intrusion detection', 'adversarial robustness', 'randomized smoothing', 'network defense'],
    authors: ['N. I. Belov', 'M. C. Alvarez', 'H. J. Fischer'],
    doi: '10.1145/3548606.3560611',
    source_url: 'https://doi.org/10.1145/3548606.3560611',
    source_type: 'dataset'
  },
  {
    id: 'syn-sec-003',
    title: 'Automated Smart Contract Vulnerability Detection via Symbolic Execution and Bytecode Transformers',
    abstract: 'Reentrancy, integer overflows, and flash loan vulnerabilities in Ethereum smart contracts cause hundreds of millions in financial losses annually. We synthesize symbolic execution constraint solvers with attention-based bytecode transformers to pinpoint reentrancy hazards. On 10,000 audited contracts, our hybrid scanner identified 23 previously overlooked critical vulnerabilities.',
    publication_year: 2023,
    category: 'Cybersecurity',
    keywords: ['smart contracts', 'symbolic execution', 'bytecode analysis', 'vulnerability detection'],
    authors: ['Y. Chen', 'D. G. Miller', 'A. P. Scott'],
    doi: '10.1145/3597503.3639144',
    source_url: 'https://doi.org/10.1145/3597503.3639144',
    source_type: 'dataset'
  },
  {
    id: 'syn-sec-004',
    title: 'LLM Agent Jailbreak Detection via Multi-Agent Semantic Consistency Guardrails',
    abstract: 'Autonomous software agents powered by large language models are vulnerable to indirect prompt injections that bypass safety system instructions. We introduce a dual-agent referee architecture where a shadow verifier checks token intent against constitutional policy constraints. In red-team evaluations across multi-turn prompt injection payloads, evasion rates plummeted from 42% to beneath 1.5%.',
    publication_year: 2025,
    category: 'Cybersecurity',
    keywords: ['LLM safety', 'jailbreak detection', 'prompt injection', 'multi-agent guardrails'],
    authors: ['A. M. Sinclair', 'K. B. Rao', 'E. J. Dubois'],
    doi: '10.48550/arXiv.2501.07721',
    source_url: 'https://arxiv.org/abs/2501.07721',
    source_type: 'dataset'
  },

  // --- Machine Learning ---
  {
    id: 'syn-ml-001',
    title: 'Provable Convergence Bounds for Non-Convex Stochastic Gradient MCMC on Overparameterized Manifolds',
    abstract: 'Stochastic gradient Markov chain Monte Carlo algorithms are widely used for Bayesian posterior sampling in high-dimensional machine learning models. However, non-convex loss surfaces typically violate log-Sobolev inequalities, destroying classical convergence rates. We establish uniform geometric ergodicity under degenerate noise conditions by constructing a modified Lyapunov function tailored to overparameterized neural architectures.',
    publication_year: 2021,
    category: 'Machine Learning',
    keywords: ['stochastic gradient MCMC', 'non-convex optimization', 'Bayesian learning', 'convergence bounds'],
    authors: ['E. P. Hastings', 'D. H. Kim', 'R. M. Laurent'],
    doi: '10.5555/3546258.3546312',
    source_url: 'https://proceedings.mlr.press/v139/hastings21a.html',
    source_type: 'dataset'
  },
  {
    id: 'syn-ml-002',
    title: 'Adaptive Learning Rate Scheduling via Hessian-Free Curvature Estimation',
    abstract: 'First-order optimization methods in deep learning rely heavily on empirical learning rate schedules such as cosine annealing. We formulate a lightweight second-order curvature approximation using finite-difference stochastic vector products that adjusts step sizes per layer without material matrix inversion cost. Empirical benchmarking across ImageNet and GLUE benchmarks shows faster wall-clock convergence.',
    publication_year: 2022,
    category: 'Machine Learning',
    keywords: ['optimization', 'Hessian-free', 'learning rate schedule', 'second-order methods'],
    authors: ['J. K. Thornton', 'P. S. Chen', 'T. E. Miller'],
    doi: '10.1609/aaai.v36i7.20811',
    source_url: 'https://doi.org/10.1609/aaai.v36i7.20811',
    source_type: 'dataset'
  },
  {
    id: 'syn-ml-003',
    title: 'Meta-Reinforcement Learning via Latent Contextual State Decoupling',
    abstract: 'Fast adaptation to non-stationary transition dynamics in reinforcement learning demands disentangling system environmental parameters from agent behavioral policies. We formulate a variational information-bottleneck meta-RL framework that encodes task dynamics into a compact Gaussian latent variable. Experiments on complex robotic locomotion environments prove instant zero-shot policy adaptation upon mass and friction perturbations.',
    publication_year: 2023,
    category: 'Machine Learning',
    keywords: ['meta-learning', 'reinforcement learning', 'variational inference', 'task adaptation'],
    authors: ['S. V. Al-Mansoor', 'L. C. Zhang', 'B. C. Kelly'],
    doi: '10.5555/3618408.3619210',
    source_url: 'https://proceedings.neurips.cc/paper/2023/hash/latent_meta_rl.pdf',
    source_type: 'dataset'
  },
  {
    id: 'syn-ml-004',
    title: 'Out-of-Distribution Generalization Through Spectral Invariant Risk Minimization',
    abstract: 'Empirical risk minimization models notoriously latch onto spurious correlations that dissolve under test distribution shifts. We propose spectral invariant risk minimization that penalizes high-frequency representation eigenvalues across disparate training domains. The method achieves state-of-the-art out-of-distribution generalization on Wilds medical and satellite benchmarks without requiring explicit test domain knowledge.',
    publication_year: 2024,
    category: 'Machine Learning',
    keywords: ['out-of-distribution', 'invariant risk minimization', 'domain generalization', 'spurious correlations'],
    authors: ['F. H. Schmidt', 'M. N. Thorne', 'Y. K. Zhao'],
    doi: '10.1145/3618257.3624801',
    source_url: 'https://doi.org/10.1145/3618257.3624801',
    source_type: 'dataset'
  },

  // --- Deep Learning ---
  {
    id: 'syn-dl-001',
    title: 'Scaling Laws for Deep Mixture-of-Experts Under Asymmetric Compute Budgets',
    abstract: 'Mixture-of-experts (MoE) architectures drastically scale model capacity while keeping inference FLOPs approximately constant. However, optimal routing balance and expert capacity factors under constrained compute regimes remain poorly characterized. We derive empirical scaling exponents linking active parameter count, expert count, and total training tokens across five orders of compute magnitude.',
    publication_year: 2023,
    category: 'Deep Learning',
    keywords: ['scaling laws', 'mixture-of-experts', 'parameter efficiency', 'deep learning theory'],
    authors: ['Dr. H. M. Al-Khatib', 'S. K. Lee', 'G. T. Lefevre'],
    doi: '10.48550/arXiv.2309.08586',
    source_url: 'https://arxiv.org/abs/2309.08586',
    source_type: 'dataset'
  },
  {
    id: 'syn-dl-002',
    title: 'Implicit Bias of Deep Residual Networks in Overparameterized Interpolation',
    abstract: 'Understanding why highly overparameterized deep networks generalize rather than simply memorizing training labels is a foundational question. We analyze the trajectory of gradient descent in deep residual architectures, proving that skip connections bias parameters toward minimum nuclear norm functional representations. Numerical simulations confirm our theoretical margin expansion bounds.',
    publication_year: 2021,
    category: 'Deep Learning',
    keywords: ['residual networks', 'implicit bias', 'overparameterization', 'generalization bounds'],
    authors: ['N. D. Schmidt', 'V. N. Sharma', 'A. J. Dupont'],
    doi: '10.5555/3495724.3496811',
    source_url: 'https://proceedings.mlr.press/v119/schmidt20a.html',
    source_type: 'dataset'
  },
  {
    id: 'syn-dl-003',
    title: 'Normalizing Flows on Riemannian Manifolds for Generative Density Modeling',
    abstract: 'Modeling probability densities on non-Euclidean geometries, such as spherical and hyperbolic spaces, is essential in planetary physics and relational network science. We formulate continuous-time normalizing flows governed by Riemannian vector fields with analytical Jacobian trace estimation. Evaluations on geographic and cosmological spherical datasets show superior log-likelihoods over Euclidean projections.',
    publication_year: 2022,
    category: 'Deep Learning',
    keywords: ['normalizing flows', 'Riemannian manifolds', 'density estimation', 'geometric deep learning'],
    authors: ['P. T. Gallagher', 'E. M. Vance', 'C. S. Becker'],
    doi: '10.1109/TPAMI.2022.3168901',
    source_url: 'https://doi.org/10.1109/TPAMI.2022.3168901',
    source_type: 'dataset'
  },
  {
    id: 'syn-dl-004',
    title: 'Exact Quantization of Multi-Layer Perceptrons with Error-Compensated Integer Gradients',
    abstract: 'Post-training quantization to low-bit integer representations often induces severe degradation in downstream classification accuracy. We engineer an error-compensated integer training protocol where residual quantization quantization errors are propagated into subsequent mini-batch forward passes. The architecture permits fully 4-bit integer weights and activations on edge accelerators with zero loss in Top-1 accuracy.',
    publication_year: 2024,
    category: 'Deep Learning',
    keywords: ['quantization', 'integer arithmetic', 'hardware acceleration', 'edge AI'],
    authors: ['K. Tanaka', 'D. M. Fraser', 'S. M. Das'],
    doi: '10.1109/TC.2024.3367120',
    source_url: 'https://doi.org/10.1109/TC.2024.3367120',
    source_type: 'dataset'
  },

  // --- Artificial Intelligence ---
  {
    id: 'syn-ai-001',
    title: 'Neuro-Symbolic Integration for Verified Commonsense Decision Making',
    abstract: 'Pure neural networks struggle with strict axiomatic consistency, while symbolic reasoning engines fail to handle messy perceptual ambiguity. We construct a unified neuro-symbolic framework where probabilistic soft logic constraints guide the latent representation space of a foundation transformer. On safety-critical decision benchmarks, the system guarantees 100% adherence to defined invariant safety policies while maintaining high predictive accuracy.',
    publication_year: 2022,
    category: 'Artificial Intelligence',
    keywords: ['neuro-symbolic AI', 'probabilistic logic', 'commonsense reasoning', 'safety verification'],
    authors: ['Prof. L. Zhao', 'J. W. Lee', 'H. G. Miller'],
    doi: '10.1016/j.artint.2022.103719',
    source_url: 'https://doi.org/10.1016/j.artint.2022.103719',
    source_type: 'dataset'
  },
  {
    id: 'syn-ai-002',
    title: 'Autonomous Multi-Agent Deliberation for Collaborative Scientific Hypothesis Generation',
    abstract: 'Accelerating academic discovery requires coordinating teams of specialized AI agents that synthesize disparate domain literatures. We present a multi-agent deliberation architecture where peer-reviewer, synthesizer, and verifier agents iteratively critique proposed hypotheses through formal epistemic logic trees. In blind evaluations with human domain experts, 68% of generated biomedical research hypotheses were rated novel and experimentally testable.',
    publication_year: 2024,
    category: 'Artificial Intelligence',
    keywords: ['multi-agent systems', 'scientific discovery', 'automated hypothesis generation', 'collaborative AI'],
    authors: ['A. J. Dupont', 'M. E. Rossi', 'S. N. Thorne'],
    doi: '10.1038/s41586-024-07521-3',
    source_url: 'https://doi.org/10.1038/s41586-024-07521-3',
    source_type: 'dataset'
  },
  {
    id: 'syn-ai-003',
    title: 'Epistemic Uncertainty Quantification in Safety-Critical Autonomous Systems',
    abstract: 'Autonomous vehicles operating in edge-case weather conditions must distinguish between irreducible sensor noise and true epistemic ignorance. We develop a conformal prediction wrapper utilizing ensemble dropout variance that delivers certifiable finite-sample coverage guarantees. Real-world autonomous vehicle fleet data demonstrates 0% false confidence assertions during dense blizzard conditions.',
    publication_year: 2023,
    category: 'Artificial Intelligence',
    keywords: ['uncertainty quantification', 'conformal prediction', 'autonomous driving', 'AI safety'],
    authors: ['K. Weber', 'O. R. Fontaine', 'T. G. Nielsen'],
    doi: '10.1109/TIV.2023.3278910',
    source_url: 'https://doi.org/10.1109/TIV.2023.3278910',
    source_type: 'dataset'
  },
  {
    id: 'syn-ai-004',
    title: 'Constitutional Direct Preference Alignment for Value-Aligned Generative Agents',
    abstract: 'Aligning autonomous agents with human ethical guidelines via reinforcement learning from human feedback frequently incurs policy instability and reward hacking. We develop a direct preference optimization variant regularized by explicit constitutional critique constraints. Evaluated across contested conversational prompts, our approach maintains helpfulness while eliminating toxic and evasive behaviors.',
    publication_year: 2023,
    category: 'Artificial Intelligence',
    keywords: ['constitutional AI', 'model alignment', 'direct preference optimization', 'AI ethics'],
    authors: ['L. C. Zhang', 'T. R. Vance', 'E. G. O\'Connor'],
    doi: '10.48550/arXiv.2310.02100',
    source_url: 'https://arxiv.org/abs/2310.02100',
    source_type: 'dataset'
  },

  // --- Data Science ---
  {
    id: 'syn-ds-001',
    title: 'Contrastive Graph Representation Learning for Anomaly Discovery in Financial Transaction Networks',
    abstract: 'Detecting organized money laundering and fraudulent circular transaction rings in high-throughput banking graphs requires discerning atypical topology from standard mercantile activity. We present a self-supervised contrastive framework that computes edge perturbation invariants across multi-hop subgraphs. Benchmarking on actual synthetic transaction graphs reveals higher precision in isolating illicit cycles.',
    publication_year: 2021,
    category: 'Data Science',
    keywords: ['graph representation', 'contrastive learning', 'financial fraud', 'anomaly discovery'],
    authors: ['S. H. Al-Farooq', 'M. G. Tanaka', 'D. K. O\'Reilly'],
    doi: '10.1145/3447548.3467210',
    source_url: 'https://doi.org/10.1145/3447548.3467210',
    source_type: 'dataset'
  },
  {
    id: 'syn-ds-002',
    title: 'Streaming Frequent Itemset Mining on Memory-Constrained Hardware via Adaptive Sketching',
    abstract: 'Processing massive data streams generated by internet-of-things sensors prohibits storing raw transaction histories in RAM. We design an adaptive Count-Min sketching structure that dynamically adjusts hashing depth based on stream velocity and entropy. The system maintains guaranteed epsilon-bounds on frequent itemset estimations while using 85% less memory.',
    publication_year: 2020,
    category: 'Data Science',
    keywords: ['frequent itemsets', 'streaming algorithms', 'sketching', 'memory efficiency'],
    authors: ['J. P. Dupont', 'T. N. Verma', 'L. C. Becker'],
    doi: '10.1007/s10618-020-00689-1',
    source_url: 'https://doi.org/10.1007/s10618-020-00689-1',
    source_type: 'dataset'
  },
  {
    id: 'syn-ds-003',
    title: 'Causal Discovery from Observational Time Series via Directed Acyclic Graph Invariance',
    abstract: 'Distinguishing true causal dependencies from spurious statistical correlations in observational scientific time series remains a foundational challenge. We formulate a constraint-based causal discovery framework utilizing kernel conditional independence tests with time-lagged invariance constraints. Validated on macroeconomic and climate datasets, our approach recovers verified causal graphs with fewer false edges.',
    publication_year: 2023,
    category: 'Data Science',
    keywords: ['causal discovery', 'time series', 'directed acyclic graphs', 'conditional independence'],
    authors: ['E. M. Vance', 'R. T. Joshi', 'K. I. Lindner'],
    doi: '10.1214/23-EJS2134',
    source_url: 'https://doi.org/10.1214/23-EJS2134',
    source_type: 'dataset'
  },
  {
    id: 'syn-ds-004',
    title: 'Automated Missing Value Imputation in Heterogeneous Industrial Tables via Optimal Transport',
    abstract: 'Industrial IoT datasets routinely suffer from intermittent network dropouts, generating heterogeneous tabular records with non-random missingness. We introduce an imputation framework based on regularized Wasserstein optimal transport distances between complete and corrupted batches. On telemetry datasets, our pipeline yields lower reconstruction error than standard MICE or KNN imputation.',
    publication_year: 2022,
    category: 'Data Science',
    keywords: ['missing data', 'optimal transport', 'tabular data', 'data imputation'],
    authors: ['T. L. Morata', 'M. B. Sullivan', 'D. F. Gupta'],
    doi: '10.1109/TKDE.2022.3189012',
    source_url: 'https://doi.org/10.1109/TKDE.2022.3189012',
    source_type: 'dataset'
  },

  // --- Distributed Computing ---
  {
    id: 'syn-dist-001',
    title: 'Asynchronous Decentralized SGD for Geo-Distributed Foundation Model Pre-Training',
    abstract: 'Training large neural networks across distributed data centers with variable wide-area network latency introduces severe straggler bottlenecks in synchronous AllReduce rings. We propose an asynchronous gossip-based parameter averaging protocol with stale gradient moment correction that decouples compute steps across geographical regions. Experiments spanning clusters in Europe and North America demonstrate 2.8x throughput acceleration with zero divergence.',
    publication_year: 2022,
    category: 'Distributed Computing',
    keywords: ['distributed systems', 'asynchronous SGD', 'geo-distributed training', 'gossip protocols'],
    authors: ['Dr. P. A. Henderson', 'C. M. Rossi', 'N. D. Sharma'],
    doi: '10.1145/3542929.3563481',
    source_url: 'https://doi.org/10.1145/3542929.3563481',
    source_type: 'dataset'
  },
  {
    id: 'syn-dist-002',
    title: 'Fault-Tolerant Consensus for Byzantine State Machine Replication in Wireless Ad-Hoc Networks',
    abstract: 'Autonomous edge drone swarms operating without centralized infrastructure require resilient consensus algorithms under packet loss and adversarial node compromise. We design a leaderless Byzantine fault-tolerant consensus protocol utilizing threshold cryptographic signatures and DAG-based transaction logging. Experimental field tests confirm 100% agreement safety under 30% node dropouts.',
    publication_year: 2023,
    category: 'Distributed Computing',
    keywords: ['Byzantine fault tolerance', 'distributed consensus', 'state machine replication', 'edge networks'],
    authors: ['B. S. O\'Reilly', 'L. T. Zhang', 'M. K. Weber'],
    doi: '10.1109/TMC.2023.3267120',
    source_url: 'https://doi.org/10.1109/TMC.2023.3267120',
    source_type: 'dataset'
  },
  {
    id: 'syn-dist-003',
    title: 'Dynamic Workload Balancing for Serverless Microservices via Predictive Auto-Scaling Queues',
    abstract: 'Fluctuating user invocation patterns in serverless cloud environments cause cold starts and costly resource over-provisioning. We formulate a predictive auto-scaling scheduler that applies temporal convolutional networks to forecast bursty queue depth 30 seconds ahead of time. Evaluated on production trace workloads, mean end-to-end latency is curtailed by 41% with a 19% reduction in cloud cost.',
    publication_year: 2024,
    category: 'Distributed Computing',
    keywords: ['serverless', 'microservices', 'auto-scaling', 'cloud computing'],
    authors: ['F. M. Lefevre', 'C. K. Chen', 'T. B. Sullivan'],
    doi: '10.1145/3620666.3651341',
    source_url: 'https://doi.org/10.1145/3620666.3651341',
    source_type: 'dataset'
  },
  {
    id: 'syn-dist-004',
    title: 'Resilient Distributed Key-Value Store with RDMA One-Sided Primitive Acceleration',
    abstract: 'High-throughput in-memory key-value stores are traditionally constrained by kernel context switching and CPU core contention during RPC packet parsing. We engineer a distributed key-value store architecture that utilizes one-sided Remote Direct Memory Access (RDMA) bypass verbs to read and write hash indices without remote CPU intervention. The storage engine processes 120 million operations per second at sub-5-microsecond latency.',
    publication_year: 2025,
    category: 'Distributed Computing',
    keywords: ['RDMA', 'key-value store', 'in-memory storage', 'kernel bypass'],
    authors: ['G. D. Falkner', 'R. M. Joshi', 'K. T. Brandt'],
    doi: '10.1145/3700000.3700021',
    source_url: 'https://doi.org/10.1145/3700000.3700021',
    source_type: 'dataset'
  },

  // --- Other / Uncertain ---
  {
    id: 'syn-other-001',
    title: 'Photovoltaic Power Forecasting Using Spatio-Temporal Graph Attention Transformers',
    abstract: 'Solar energy grid integration is complicated by rapid weather-induced volatility and cloud movement across distributed solar farms. We formulate a spatio-temporal graph attention transformer that models topological solar plant irradiance sensors while processing meteorological satellite imagery. On multi-year grid datasets, our approach reduced day-ahead mean absolute forecasting error by 18.6%.',
    publication_year: 2022,
    category: 'Other / Uncertain',
    keywords: ['photovoltaic forecasting', 'spatio-temporal', 'solar energy', 'grid integration'],
    authors: ['D. K. Nair', 'S. P. Jensen', 'H. G. Al-Khatib'],
    doi: '10.1016/j.apenergy.2022.119420',
    source_url: 'https://doi.org/10.1016/j.apenergy.2022.119420',
    source_type: 'dataset'
  },
  {
    id: 'syn-other-002',
    title: 'Sim-to-Real Policy Transfer for Bipedal Locomotion over Rough Terrain Using Domain Randomization',
    abstract: 'Reinforcement learning policies trained in simulated environments typically fail on real robotic hardware due to simulator fidelity gaps. We present a curriculum learning strategy that progressively introduces dynamics domain randomization, including foot friction, joint latency, and payload disturbances. Tested on a physical bipedal robot, the policy navigated rocky uneven terrain without any real-world training steps.',
    publication_year: 2021,
    category: 'Other / Uncertain',
    keywords: ['sim-to-real', 'reinforcement learning', 'bipedal locomotion', 'domain randomization'],
    authors: ['L. J. Vance', 'M. Takahashi', 'H. K. Gruber'],
    doi: '10.1109/LRA.2021.3061234',
    source_url: 'https://doi.org/10.1109/LRA.2021.3061234',
    source_type: 'dataset'
  }
];

export function getSampleDatasetCsv(): string {
  const headers = ['title', 'abstract', 'publication_year', 'category', 'keywords', 'authors', 'doi', 'source_url'];
  const rows = SYNTHETIC_RESEARCH_PAPERS.map(paper => {
    const escapeCsv = (val: string | number | undefined) => {
      const str = String(val || '').replace(/"/g, '""');
      return `"${str}"`;
    };
    return [
      escapeCsv(paper.title),
      escapeCsv(paper.abstract),
      paper.publication_year,
      escapeCsv(paper.category),
      escapeCsv(paper.keywords.join('; ')),
      escapeCsv(paper.authors.join('; ')),
      escapeCsv(paper.doi),
      escapeCsv(paper.source_url)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
