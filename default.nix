# default.nix
# The environment shell for this project
#
# Tested with nixpkgs-b280b6c
#

with import <nixpkgs> {};

let
    rustFuns = pkgs.callPackage ./support/rust-nightly.nix {
        stableVersion = "1.15.1";
    };
    deps = [ (rustFuns.rust {}) nodejs-6_x ];
    packageName = "frames";
in {
  framesEnv = stdenv.mkDerivation {
      name = packageName;
      buildInputs = [ stdenv ] ++ deps;
      shellHook =
      let
        red = "\\[\\e[0;31m\\]";
        rcol = "\\[\\e[0m\\]";
        green = "\\[\\e[0;32m\\]";
      in
      ''
        export PROMPT_COMMAND=__prompt_command  # Func to gen PS1 after CMDs

        function __prompt_command() {
            local EXIT="$?"             # This needs to be first
            PS1="(${packageName}) "

            if [ $EXIT != 0 ]; then
                PS1+="${red}[\!] \W$ ${rcol}"
            else
                PS1+="${green}[\!] \W$ ${rcol}"
            fi
        }

        # TODO(ethan): do this the right way by adding a source downloader
        # to rust-nightly-nix
        # export RUST_SRC_PATH="/home/ethan/Documents/rustlib/rustc-1.15.0/src"
      '';
  };
}
 
