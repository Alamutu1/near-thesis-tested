// Thesis Agent escrow — TESTNET ONLY, minimal.
// Rules, enforced on chain:
//  - create_job: payer attaches the job price in testnet NEAR; the
//    contract holds it. No mainnet, no real money.
//  - record_evidence: only the named checker can record an evidence
//    link for the job.
//  - mark_passed: only the checker, and only after an evidence link
//    has been recorded. Nothing can be released without evidence.
//  - release: only after mark_passed; pays the checker, once.
//  - refund: only the payer, only while the job is still open
//    (walk-away); returns the held price to the payer, once.
// No token, no DAO, no marketplace logic. Status is a plain string
// so the demo stays readable: "created", "passed", "released",
// "refunded".
use near_sdk::{env, near, AccountId, NearToken, Promise, store::LookupMap};

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Job {
    pub payer: AccountId,
    pub checker: AccountId,
    pub claim_text: String,
    pub price: NearToken,
    pub evidence_link: Option<String>,
    pub passed: bool,
    pub status: String,
}

#[near(contract_state)]
pub struct Escrow {
    jobs: LookupMap<String, Job>,
}

#[near]
impl Escrow {
    #[init]
    pub fn new() -> Self {
        Self { jobs: LookupMap::new(b"j") }
    }

    #[payable]
    pub fn create_job(&mut self, job_id: String, claim_text: String, checker: AccountId) {
        assert!(!self.jobs.contains_key(&job_id), "job already exists");
        let price = env::attached_deposit();
        assert!(price.as_yoctonear() > 0, "attach a testnet NEAR price for the job");
        let job = Job {
            payer: env::predecessor_account_id(),
            checker,
            claim_text,
            price,
            evidence_link: None,
            passed: false,
            status: "created".to_string(),
        };
        self.jobs.insert(job_id, job);
    }

    pub fn record_evidence(&mut self, job_id: String, evidence_link: String) {
        let mut job = self.jobs.get(&job_id).expect("job not found").clone();
        assert_eq!(env::predecessor_account_id(), job.checker, "only the checker can record evidence");
        assert_eq!(job.status, "created", "job is no longer open");
        job.evidence_link = Some(evidence_link);
        self.jobs.insert(job_id, job);
    }

    pub fn mark_passed(&mut self, job_id: String) {
        let mut job = self.jobs.get(&job_id).expect("job not found").clone();
        assert_eq!(env::predecessor_account_id(), job.checker, "only the checker can mark passed");
        assert_eq!(job.status, "created", "job is no longer open");
        assert!(job.evidence_link.is_some(), "evidence link must be recorded before passing");
        job.passed = true;
        job.status = "passed".to_string();
        self.jobs.insert(job_id, job);
    }

    pub fn release(&mut self, job_id: String) -> Promise {
        let mut job = self.jobs.get(&job_id).expect("job not found").clone();
        assert!(job.passed, "job has not passed");
        assert_eq!(job.status, "passed", "job is not in a releasable state");
        job.status = "released".to_string();
        let checker = job.checker.clone();
        let price = job.price;
        self.jobs.insert(job_id, job);
        Promise::new(checker).transfer(price)
    }

    pub fn refund(&mut self, job_id: String) -> Promise {
        let mut job = self.jobs.get(&job_id).expect("job not found").clone();
        assert_eq!(env::predecessor_account_id(), job.payer, "only the payer can refund");
        assert_eq!(job.status, "created", "only an open job can be refunded (walk-away)");
        job.status = "refunded".to_string();
        let payer = job.payer.clone();
        let price = job.price;
        self.jobs.insert(job_id, job);
        Promise::new(payer).transfer(price)
    }

    pub fn get_job(&self, job_id: String) -> Option<Job> {
        self.jobs.get(&job_id).cloned()
    }
}

impl Default for Escrow {
    fn default() -> Self {
        Self { jobs: LookupMap::new(b"j") }
    }
}
